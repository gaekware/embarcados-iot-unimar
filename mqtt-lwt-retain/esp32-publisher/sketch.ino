/**
 * mqtt-lwt-retain — ESP32 Publisher
 *
 * Demonstra o uso de:
 *   - Last Will and Testament (LWT): mensagem publicada pelo broker
 *     automaticamente quando o ESP32 se desconecta de forma inesperada.
 *   - Retain Flag: o broker guarda a última mensagem de "status" e a
 *     entrega imediatamente a qualquer novo assinante.
 *
 * Broker público (sem autenticação): broker.hivemq.com:1883
 *
 * Tópicos:
 *   unimar/esp32/status      → "ONLINE" (retain=true) | "OFFLINE" (LWT)
 *   unimar/esp32/temperatura → leitura DHT22 em °C
 *   unimar/esp32/umidade     → leitura DHT22 em %
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include "DHT.h"

// ── Sensor DHT22 ─────────────────────────────────────────────────────────────
#define DHTPIN  4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// ── Rede ─────────────────────────────────────────────────────────────────────
const char* WIFI_SSID     = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";

// ── MQTT ─────────────────────────────────────────────────────────────────────
const char* MQTT_BROKER   = "broker.hivemq.com";
const int   MQTT_PORT     = 1883;
const char* MQTT_CLIENT_ID = "unimar-esp32-01";

// Tópicos
const char* TOPIC_STATUS = "unimar/esp32/status";
const char* TOPIC_TEMP   = "unimar/esp32/temperatura";
const char* TOPIC_HUM    = "unimar/esp32/umidade";

// LWT — payload que o broker publicará se o ESP32 cair inesperadamente
const char* LWT_PAYLOAD  = "OFFLINE";

// ── Intervalo de publicação ───────────────────────────────────────────────────
const unsigned long PUBLISH_INTERVAL_MS = 5000;
unsigned long lastPublish = 0;

// ── Objetos globais ──────────────────────────────────────────────────────────
WiFiClient   wifiClient;
PubSubClient mqttClient(wifiClient);

// ─────────────────────────────────────────────────────────────────────────────
// WiFi
// ─────────────────────────────────────────────────────────────────────────────
void connectWiFi() {
  Serial.print("[WiFi] Conectando a ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("[WiFi] Conectado! IP: ");
  Serial.println(WiFi.localIP());
}

// ─────────────────────────────────────────────────────────────────────────────
// MQTT — conecta com LWT configurado
// ─────────────────────────────────────────────────────────────────────────────
void connectMQTT() {
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);

  while (!mqttClient.connected()) {
    Serial.print("[MQTT] Conectando ao broker ");
    Serial.print(MQTT_BROKER);
    Serial.print("...");

    /**
     * connect( clientId,
     *          user,     password,
     *          willTopic, willQoS, willRetain, willMessage )
     *
     * willRetain = false → o LWT em si NÃO é retido.
     * Queremos apenas que o broker o publique quando o cliente cair.
     * O Retain Flag do LWT indicaria se a mensagem "OFFLINE" ficaria
     * armazenada no broker; aqui preferimos false para não confundir
     * novos assinantes com um "OFFLINE" antigo após a reconexão.
     */
    bool ok = mqttClient.connect(
      MQTT_CLIENT_ID,   // clientId
      nullptr,          // username (não usado no broker público)
      nullptr,          // password
      TOPIC_STATUS,     // willTopic
      1,                // willQoS  (QoS 1 = pelo menos uma entrega)
      false,            // willRetain
      LWT_PAYLOAD       // willMessage — "OFFLINE"
    );

    if (ok) {
      Serial.println(" conectado!");

      /**
       * RETAIN FLAG — publica "ONLINE" com retain=true.
       *
       * O broker armazena esta mensagem. Qualquer novo assinante
       * de "unimar/esp32/status" a receberá imediatamente, mesmo
       * que o ESP32 não publique nada naquele momento.
       *
       * publish( topic, payload, retain )
       */
      mqttClient.publish(TOPIC_STATUS, "ONLINE", /*retain=*/true);
      Serial.println("[MQTT] Status ONLINE publicado (retained).");

    } else {
      Serial.print(" falhou, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" — tentando novamente em 3s...");
      delay(3000);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Leitura do sensor
// ─────────────────────────────────────────────────────────────────────────────
bool readSensor(float &temp, float &hum) {
  hum  = dht.readHumidity();
  temp = dht.readTemperature();

  if (isnan(hum) || isnan(temp)) {
    Serial.println("[Sensor] Erro ao ler DHT22.");
    return false;
  }
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Publicação dos dados do sensor
// ─────────────────────────────────────────────────────────────────────────────
void publishSensorData(float temp, float hum) {
  char buf[16];

  // Temperatura — sem retain (dado contínuo, não é "estado")
  dtostrf(temp, 5, 2, buf);
  mqttClient.publish(TOPIC_TEMP, buf, /*retain=*/false);
  Serial.print("[MQTT] Temperatura publicada: ");
  Serial.println(buf);

  // Umidade — sem retain
  dtostrf(hum, 5, 2, buf);
  mqttClient.publish(TOPIC_HUM, buf, /*retain=*/false);
  Serial.print("[MQTT] Umidade publicada: ");
  Serial.println(buf);
}

// ─────────────────────────────────────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("=== MQTT: Last Will e Retain Flag ===");

  dht.begin();
  connectWiFi();
  connectMQTT();
}

// ─────────────────────────────────────────────────────────────────────────────
// Loop
// ─────────────────────────────────────────────────────────────────────────────
void loop() {
  // Mantém a conexão MQTT viva; reconecta se necessário
  if (!mqttClient.connected()) {
    Serial.println("[MQTT] Conexão perdida. Reconectando...");
    connectMQTT();
  }
  mqttClient.loop();

  // Publicação periódica de temperatura e umidade
  if (millis() - lastPublish >= PUBLISH_INTERVAL_MS) {
    lastPublish = millis();

    float temp, hum;
    if (readSensor(temp, hum)) {
      publishSensorData(temp, hum);
    }
  }
}
