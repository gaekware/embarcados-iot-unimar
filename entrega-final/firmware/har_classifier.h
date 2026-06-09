// har_classifier.h - inferencia do modelo WISDM Conv1D (int8) com TFLite Micro.
#ifndef HAR_CLASSIFIER_H_
#define HAR_CLASSIFIER_H_

#include <Arduino.h>
#include <math.h>

#include "tensorflow/lite/micro/micro_mutable_op_resolver.h"
#include "tensorflow/lite/micro/micro_interpreter.h"
#include "tensorflow/lite/micro/micro_log.h"
#include "tensorflow/lite/schema/schema_generated.h"

#include "wisdm_model.h"

#define HAR_WINDOW_SIZE   80
#define HAR_NUM_AXES      3
#define HAR_NUM_CLASSES   6
#define HAR_SAMPLE_RATE   20

static const char* HAR_LABELS[HAR_NUM_CLASSES] = {
    "Downstairs", "Jogging", "Sitting", "Standing", "Upstairs", "Walking"
};

// Normalizacao por eixo (do treino): xn = (x - media) / desvio, x em m/s^2.
static const float HAR_WIN_MEAN[HAR_NUM_AXES] = {0.676f, 7.223f, 0.397f};
static const float HAR_WIN_STD[HAR_NUM_AXES]  = {6.878f, 6.747f, 4.762f};

namespace {
constexpr int kHarArenaSize = 24 * 1024;
alignas(16) uint8_t g_har_arena[kHarArenaSize];

const tflite::Model*      g_har_model       = nullptr;
tflite::MicroInterpreter* g_har_interpreter = nullptr;
TfLiteTensor*             g_har_input       = nullptr;
TfLiteTensor*             g_har_output      = nullptr;

tflite::MicroMutableOpResolver<7> g_har_resolver;
}  // namespace

inline bool harBegin() {
    g_har_model = tflite::GetModel(wisdm_conv1d_int8_tflite);
    if (g_har_model->version() != TFLITE_SCHEMA_VERSION) {
        MicroPrintf("Schema do modelo (%d) != suportado (%d)",
                    g_har_model->version(), TFLITE_SCHEMA_VERSION);
        return false;
    }

    g_har_resolver.AddConv2D();
    g_har_resolver.AddExpandDims();
    g_har_resolver.AddFullyConnected();
    g_har_resolver.AddMaxPool2D();
    g_har_resolver.AddMean();
    g_har_resolver.AddReshape();
    g_har_resolver.AddSoftmax();

    static tflite::MicroInterpreter interpreter(
        g_har_model, g_har_resolver, g_har_arena, kHarArenaSize);
    g_har_interpreter = &interpreter;

    if (g_har_interpreter->AllocateTensors() != kTfLiteOk) {
        MicroPrintf("Falha em AllocateTensors() - aumente kHarArenaSize");
        return false;
    }

    g_har_input  = g_har_interpreter->input(0);
    g_har_output = g_har_interpreter->output(0);

    if (g_har_input->dims->size != 3 ||
        g_har_input->dims->data[1] != HAR_WINDOW_SIZE ||
        g_har_input->dims->data[2] != HAR_NUM_AXES ||
        g_har_input->type != kTfLiteInt8) {
        MicroPrintf("Formato de entrada inesperado");
        return false;
    }
    return true;
}

// Recebe a janela bruta [80][3] em m/s^2; retorna a classe (0..5) ou -1.
inline int harPredict(const float window[HAR_WINDOW_SIZE][HAR_NUM_AXES],
                       float* confidence = nullptr) {
    if (g_har_interpreter == nullptr) return -1;

    const float   in_scale = g_har_input->params.scale;
    const int32_t in_zp    = g_har_input->params.zero_point;

    int8_t* in = g_har_input->data.int8;
    for (int t = 0; t < HAR_WINDOW_SIZE; t++) {
        for (int a = 0; a < HAR_NUM_AXES; a++) {
            float xn = (window[t][a] - HAR_WIN_MEAN[a]) / HAR_WIN_STD[a];
            int32_t q = (int32_t)lroundf(xn / in_scale) + in_zp;
            if (q < -128) q = -128;
            if (q >  127) q =  127;
            in[t * HAR_NUM_AXES + a] = (int8_t)q;
        }
    }

    if (g_har_interpreter->Invoke() != kTfLiteOk) {
        MicroPrintf("Falha em Invoke()");
        return -1;
    }

    const float   out_scale = g_har_output->params.scale;
    const int32_t out_zp    = g_har_output->params.zero_point;
    const int8_t* out = g_har_output->data.int8;

    int   best_idx  = 0;
    float best_prob = -1.0f;
    for (int c = 0; c < HAR_NUM_CLASSES; c++) {
        float p = (out[c] - out_zp) * out_scale;
        if (p > best_prob) {
            best_prob = p;
            best_idx  = c;
        }
    }

    if (confidence) *confidence = best_prob;
    return best_idx;
}

#endif  // HAR_CLASSIFIER_H_
