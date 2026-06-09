# HAR no dispositivo — WISDM Conv1D (int8) em TinyML

Exemplo de como o modelo treinado em [wisdm_keras_tinyml.ipynb](../wisdm_keras_tinyml.ipynb)
e exportado em [wisdm_conv1d_int8.tflite](../wisdm_conv1d_int8.tflite) é embarcado em um
microcontrolador para **reconhecer a atividade física** a partir de um acelerômetro.

## Arquivos

| Arquivo | Papel |
|---|---|
| [wisdm_model.h](wisdm_model.h) | O modelo `.tflite` (int8) exportado como **array C** (`wisdm_conv1d_int8_tflite[]`). É o modelo que vai gravado no firmware. |
| [har_classifier.h](har_classifier.h) | Camada de inferência (header-only): normaliza → quantiza → invoca o TFLite Micro → desquantiza → `argmax`. Expõe `harBegin()` e `harPredict()`. |
| [har_demo.ino](har_demo.ino) | Sketch de exemplo: lê x, y, z do MPU6050 a 20 Hz e imprime a atividade prevista. |

## Pipeline executado no dispositivo

```
sensor (x,y,z) → janela 80×3 → (x-média)/desvio → quantiza int8
   → TFLite Micro (Conv1D) → desquantiza → argmax → atividade
```

Parâmetros fixos vindos do treino (não alterar sem reexportar o modelo):

- **Janela:** 80 amostras × 3 eixos, 20 Hz (~4 s), passo de 40 (50% de sobreposição)
- **Normalização por eixo:** `média = [0.676, 7.223, 0.397]`, `desvio = [6.878, 6.747, 4.762]`
- **Quantização entrada:** `scale = 0.03195039927959442`, `zero_point = 4`
- **Quantização saída:** `scale = 0.00390625`, `zero_point = -128`
- **Classes (0→5):** `Downstairs, Jogging, Sitting, Standing, Upstairs, Walking`

## Hardware de referência

- **Placa:** ESP32 (qualquer Arduino com RAM suficiente serve)
- **Sensor:** MPU6050 via I2C

| MPU6050 | ESP32 |
|---|---|
| VCC | 3V3 |
| GND | GND |
| SDA | GPIO 21 |
| SCL | GPIO 22 |

## Bibliotecas (Arduino Library Manager)

- **TensorFlow Lite for Microcontrollers** (ou `Arduino_TensorFlowLite`)
- **Adafruit MPU6050** + **Adafruit Unified Sensor**

## Como compilar e rodar

1. Coloque os três arquivos (`.ino` + os dois `.h`) na mesma pasta do sketch.
2. Selecione a placa ESP32 na IDE Arduino.
3. Compile e grave; abra o **Monitor Serial** a `115200` baud.
4. Movimente o sensor (ande, fique parado, etc.) e observe a atividade prevista.

## Como regenerar `wisdm_model.h`

```bash
xxd -i wisdm_conv1d_int8.tflite > wisdm_model.h
```

(No projeto foi usado o script Python equivalente em `entrega-final/`, que ainda
adiciona `alignas(16)` e o `#ifndef` guard.)

## Observações

- O modelo foi treinado com dados de um **smartphone no bolso** (WISDM), em **m/s²**.
  A lib Adafruit já entrega m/s², por isso não há conversão. A **orientação** do
  MPU6050 em relação ao corpo afeta a acurácia — para resultados próximos aos do
  notebook, mantenha o sensor numa orientação consistente.
- Se aparecer erro em `AllocateTensors()`, aumente `kHarArenaSize` em
  [har_classifier.h](har_classifier.h).
- O `MicroMutableOpResolver<7>` registra exatamente os 7 operadores do modelo
  (`CONV_2D, EXPAND_DIMS, FULLY_CONNECTED, MAX_POOL_2D, MEAN, RESHAPE, SOFTMAX`).
