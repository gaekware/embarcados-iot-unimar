import paho.mqtt.client as mqtt
from datetime import datetime


BROKER    = "broker.hivemq.com"
PORT      = 1883
CLIENT_ID = "unimar-monitor-01"

TOPICS = [
    ("unimar/esp32/status",      1),
    ("unimar/esp32/temperatura", 0),
    ("unimar/esp32/umidade",     0),
]


def timestamp() -> str:
    return datetime.now().strftime("%H:%M:%S")

def log(tag: str, msg: str) -> None:
    print(f"[{timestamp()}] [{tag}] {msg}")


def on_connect(client, userdata, flags, rc):
    if rc == 0:
        log("MQTT", f"Conectado ao broker {BROKER}")
        log("MQTT", "Assinando tópicos...")
        for topic, qos in TOPICS:
            client.subscribe(topic, qos)
            log("SUB", f"  {topic}  (QoS {qos})")
        print()
        print("Aguardando mensagens... (Ctrl+C para sair)")
        print("-" * 55)
    else:
        log("MQTT", f"Falha na conexão, rc={rc}")

def on_message(client, userdata, msg):
    payload  = msg.payload.decode("utf-8", errors="replace")
    retained = "  ← [RETIDA]" if msg.retain else ""

    topic_short = msg.topic.split("/")[-1].upper()

    if msg.topic.endswith("status"):
        if payload == "ONLINE":
            status_label = "🟢 ONLINE"
        else:
            status_label = "🔴 OFFLINE  ← LWT ATIVADO PELO BROKER"
        log("STATUS ", f"{status_label}{retained}")
    else:
        log(topic_short, f"{payload}{retained}")

def on_disconnect(client, userdata, rc):
    if rc != 0:
        log("MQTT", "Desconectado inesperadamente. Reconectando...")
    else:
        log("MQTT", "Desconectado.")

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    print("=" * 55)
    print("  Monitor MQTT — Last Will e Retain Flag")
    print(f"  Broker: {BROKER}:{PORT}")
    print("=" * 55)
    print()

    client = mqtt.Client(client_id=CLIENT_ID, clean_session=True)
    client.on_connect    = on_connect
    client.on_message    = on_message
    client.on_disconnect = on_disconnect

    client.connect(BROKER, PORT, keepalive=60)

    try:
        client.loop_forever()
    except KeyboardInterrupt:
        print()
        log("Monitor", "Encerrando.")
        client.disconnect()

if __name__ == "__main__":
    main()
