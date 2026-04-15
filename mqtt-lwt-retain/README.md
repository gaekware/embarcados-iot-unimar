# Last Will e Retain Flag

Demonstração prática do uso de Last Will and Testament (LWT) e Retain Flag no protocolo MQTT com ESP32, simulado via Wokwi.

---

## 📚 Conceitos

### Last Will and Testament (LWT)

O LWT (Última Vontade e Testamento) é uma mensagem configurada no momento da conexão do cliente MQTT ao broker. Ela é armazenada pelo broker e publicada automaticamente se e somente se o cliente se desconectar de forma inesperada (perda de energia, queda de rede, travamento), sem enviar um pacote `DISCONNECT` limpo.

#### Quando usar LWT

| Situação | Usar LWT? | Motivo |
|---|---|---|
| Dispositivo IoT em campo (sem UPS) | Sim | Pode perder energia a qualquer momento |
| Gateway crítico de produção | Sim | Outros sistemas precisam saber se ele caiu |
| Presença online/offline de dispositivos | Sim | Padrão "birth/death message" |
| App de desktop com desconexão limpa | Não obrigatório | Se desconecta com DISCONNECT normal |

#### Impactos no sistema IoT real

- Monitoramento de saúde da frota: O dashboard sabe imediatamente quais sensores estão offline, sem depender de timeout de heartbeat.
- Ações de fallback automáticas: Um controlador pode acionar alarmes ou modos de segurança ao receber o LWT.
- Reduz latência de detecção de falha: O broker publica o LWT em milissegundos, enquanto um timeout de polling pode levar minutos.
- Custo quase zero: É configurado apenas uma vez por conexão, sem overhead extra em operação normal.

---

### Retain Flag

A Retain Flag instrui o broker a guardar a última mensagem publicada em um determinado tópico. Quando um novo cliente assina esse tópico, ele recebe essa mensagem retida imediatamente — sem precisar esperar a próxima publicação.

#### Quando usar Retain Flag

| Situação | Usar Retain? | Motivo |
|---|---|---|
| Estado atual do dispositivo (ligado/desligado) | Sim | Novo assinante precisa do estado mais recente |
| Última leitura de sensor (temperatura, umidade) | Sim | Dashboard ao abrir mostra valor atual, não vazio |
| Configuração/parâmetros publicados pelo servidor | Sim | Dispositivo recebe config ao reconectar |
| Stream de eventos contínuos (logs, telemetria) | Não | Cada mensagem é um evento único, não um estado |
| Comandos de ação (ligar motor, disparar relé) | Não | Risco de reexecutar ação antiga em nova conexão 
#### Impactos no sistema IoT real

- Inicialização rápida: Dashboards e novos assinantes têm contexto imediato sem esperar o próximo ciclo do sensor.
- Reconexão transparente: Um dispositivo que reconecta já recebe a configuração mais recente sem precisar de um protocolo de sincronização adicional.
- Consistência de estado: Sistema distribuído com múltiplos serviços veem o mesmo último estado ao se inscrever.
- Atenção: Usar retain em tópicos de comandos pode causar reexecução de ações antigas — um relé pode religar ao reconectar o cliente. Use com critério.

---

## Estrutura do Projeto

```
mqtt-lwt-retain/
├── esp32-publisher/
│   ├── sketch.ino          ← Firmware ESP32: publica com LWT e Retain
│   ├── diagram.json        ← Circuito Wokwi (ESP32 + DHT22)
│   └── wokwi-project.txt   ← ID do projeto Wokwi
├── monitor-subscriber/
│   └── monitor.py          ← Script Python: assina e exibe mensagens
└── README.md               ← Este arquivo
```

---

## ⚙️ Stack

| Camada | Tecnologia |
|--------|-----------|
| Hardware | ESP32 (simulado no Wokwi) |
| Sensor | DHT22 (temperatura e umidade) |
| Protocolo | MQTT v3.1.1 |
| Broker | broker.hivemq.com (público, sem auth) |
| Firmware | Arduino C++ |
| Monitor | Python 3 + paho-mqtt |

---

## Como Rodar

### 1. Simulação ESP32 (Wokwi)

Acesse o projeto no Wokwi pelo link em `wokwi-project.txt` ou importe os arquivos `sketch.ino` e `diagram.json`.

Requer libs: 
- PubSubClient
- DHT22
- DHT sensor library

O ESP32 irá:
1. Conectar ao broker com LWT configurado no tópico `unimar/esp32/status` com payload `"OFFLINE"`.
2. Publicar `"ONLINE"` com Retain Flag no mesmo tópico ao conectar.
3. Publicar temperatura e umidade a cada 5 segundos.

### 2. Monitor Python

```bash
# Instalar dependência
pip install paho-mqtt

# Executar monitor
python monitor-subscriber/monitor.py
```

O monitor irá assinar os tópicos e exibir:
- O status retido recebido imediatamente ao conectar.
- As leituras de sensor em tempo real.
- O LWT `"OFFLINE"` quando o ESP32 cair.

---

## Tópicos MQTT

| Tópico | QoS | Retain | Conteúdo |
|--------|-----|--------|---------|
| `unimar/esp32/status` | 1 | ✅ Sim | `"ONLINE"` / `"OFFLINE"` (LWT) |
| `unimar/esp32/temperatura` | 0 | ❌ Não | Valor float em °C |
| `unimar/esp32/umidade` | 0 | ❌ Não | Valor float em % |

---

## 🔍 Observações de Teste

Para verificar o LWT em ação:
1. Inicie a simulação no Wokwi e observe o monitor Python receber `"ONLINE"`.
2. Pause/pare a simulação abruptamente (sem desconexão limpa).
3. Após o `keepAlive` expirar (≈15s), o broker publicará `"OFFLINE"` automaticamente.

Para verificar o Retain Flag em ação:
1. Inicie a simulação e aguarde algumas leituras.
2. Inicie o monitor Python depois que o ESP32 já estiver publicando.
3. Observe que o monitor recebe imediatamente o último status `"ONLINE"` retido, sem esperar a próxima publicação.
