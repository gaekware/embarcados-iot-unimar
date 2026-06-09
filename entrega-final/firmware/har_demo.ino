// har_demo.ino - le x,y,z do MPU6050 a 20 Hz e preve a atividade fisica.
//
// MPU6050 -> ESP32:  VCC->3V3  GND->GND  SDA->GPIO21  SCL->GPIO22
// Libs: TensorFlow Lite for Microcontrollers, Adafruit MPU6050, Adafruit Unified Sensor

#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

#include "har_classifier.h"

Adafruit_MPU6050 mpu;

static float g_window[HAR_WINDOW_SIZE][HAR_NUM_AXES];

constexpr int           kStep            = HAR_WINDOW_SIZE / 2;   // 50% de sobreposicao
constexpr unsigned long kSamplePeriodMs  = 1000UL / HAR_SAMPLE_RATE;

unsigned long g_lastSampleMs = 0;
int           g_count        = 0;
bool          g_windowFull   = false;

void setup() {
    Serial.begin(115200);
    while (!Serial) { delay(10); }

    if (!mpu.begin()) {
        Serial.println("Erro: MPU6050 nao encontrado.");
        while (true) { delay(1000); }
    }
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

    if (!harBegin()) {
        Serial.println("Erro ao inicializar o classificador HAR.");
        while (true) { delay(1000); }
    }

    Serial.println("HAR pronto. Coletando movimento...");
}

void loop() {
    const unsigned long now = millis();
    if (now - g_lastSampleMs < kSamplePeriodMs) return;
    g_lastSampleMs = now;

    sensors_event_t accel, gyro, temp;
    mpu.getEvent(&accel, &gyro, &temp);

    int idx = g_windowFull ? (HAR_WINDOW_SIZE - kStep + g_count) : g_count;
    g_window[idx][0] = accel.acceleration.x;
    g_window[idx][1] = accel.acceleration.y;
    g_window[idx][2] = accel.acceleration.z;
    g_count++;

    const int needed = g_windowFull ? kStep : HAR_WINDOW_SIZE;
    if (g_count < needed) return;

    float confidence = 0.0f;
    int   cls = harPredict(g_window, &confidence);
    if (cls >= 0) {
        Serial.print("Atividade: ");
        Serial.print(HAR_LABELS[cls]);
        Serial.print("  (");
        Serial.print(confidence * 100.0f, 1);
        Serial.println("%)");
    }

    for (int t = 0; t < HAR_WINDOW_SIZE - kStep; t++) {
        for (int a = 0; a < HAR_NUM_AXES; a++) {
            g_window[t][a] = g_window[t + kStep][a];
        }
    }
    g_count      = 0;
    g_windowFull = true;
}
