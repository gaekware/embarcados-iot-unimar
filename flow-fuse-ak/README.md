# 🧩 Desafio IoT — MQTT + Node-RED + FlowFuse

Ambiente Docker completo para integração MQTT com Node-RED gerenciado pelo FlowFuse.

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                    Docker Network: iot-net           │
│                                                     │
│  ┌──────────────┐    MQTT     ┌──────────────────┐  │
│  │  ESP32 /     │ ──────────► │  Eclipse         │  │
│  │  Simulador   │             │  Mosquitto :1883 │  │
│  └──────────────┘             └────────┬─────────┘  │
│                                        │ subscribe   │
│  ┌──────────────┐             ┌────────▼─────────┐  │
│  │  FlowFuse    │ gerencia    │  Node-RED        │  │
│  │  :3000       │ ──────────► │  :1880           │  │
│  └──────────────┘             └──────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## 📦 Serviços

| Serviço | Imagem | Porta | Descrição |
|---------|--------|-------|-----------|
| mosquitto | `eclipse-mosquitto:2.0` | 1883 / 9001 | Broker MQTT |
| node-red | `nodered/node-red:latest` | 1880 | Editor de fluxos |
| flowfuse | `flowfuse/flowfuse:latest` | 3000 | Plataforma de gerenciamento |

## 🚀 Como subir

```bash
docker compose up -d
```

## 🌐 Acessos

| Interface | URL |
|-----------|-----|
| Node-RED Editor | http://localhost:1880/admin |
| Node-RED Dashboard | http://localhost:1880/ui |
| FlowFuse | http://localhost:3000 |

## 📡 Estrutura de Tópicos MQTT

```
iot/<device>/temperatura   → publica leitura de temperatura (JSON)
iot/<device>/umidade       → publica leitura de umidade (JSON)
iot/<device>/status        → publica status do dispositivo
iot/<device>/controle      → recebe comandos (ON/OFF)
```

### Exemplos de payload

```json
// Temperatura
{ "value": 27.5, "unit": "C", "device": "esp32-sala" }

// Umidade
{ "value": 65.2, "unit": "%", "device": "esp32-sala" }

// Controle
{ "command": "ON" }
```

## 🧪 Testando com MQTT CLI

```bash
# Publicar temperatura manualmente
mosquitto_pub -h localhost -p 1883 \
  -t "iot/esp32-sala/temperatura" \
  -m '{"value": 28.3, "unit": "C", "device": "esp32-sala"}'

# Publicar umidade
mosquitto_pub -h localhost -p 1883 \
  -t "iot/esp32-sala/umidade" \
  -m '{"value": 72.1, "unit": "%", "device": "esp32-sala"}'

# Escutar todos os tópicos IoT
mosquitto_sub -h localhost -p 1883 -t "iot/#" -v
```

## 📊 Fluxo Node-RED (pré-configurado)

O arquivo `flows.json` já inclui:

- **Subscriber temperatura** → gauge + gráfico histórico
- **Subscriber umidade** → gauge + gráfico histórico
- **Subscriber status** → texto no dashboard
- **Botões Ligar/Desligar** → publica em `iot/dispositivo1/controle`
- **Simulador automático** → injeta dados a cada 5s (ESP32 virtual)

## 🔧 Instalando o Dashboard no Node-RED

Após subir os containers, acesse o editor e instale via Palette Manager:

```
node-red-dashboard
```

Ou via terminal do container:

```bash
docker exec -it node-red npm install node-red-dashboard
docker restart node-red
```
