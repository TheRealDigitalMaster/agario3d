(ns agario3d.client
  (:require [agario3d.config :refer [config]]
            [chord.client :refer [ws-ch]]
            [agario3d.loop :refer [every]]
            [cljs.core.async :refer [<! >!]])
  (:require-macros [cljs.core.async.macros :refer [go]]))

(def container (.getElementById js/document "container"))

(defn debug [msg]
  (.log js/console msg))

(defn open-channel []
  (go
    (debug "opening a channel")
    (let [{:keys [ws-channel error]} (<! (ws-ch "ws://localhost:9009/ws?name=julian&colour=0xff0000"))]
      (when error (throw error))
      ws-channel)))

(defonce chan (open-channel))

(defonce server->client
  (go
    (debug "starting to listen for messages from the server")
    (loop []
      (when-let [game (:message (<! chan))]
        (debug "received a message from the server")
        (recur)))))

(defonce client->server
  (go
    (debug "starting a loop to send messages to the server")
    (let [tick-ch (every 1000)]
      (loop [t 0]
        (debug "about to send a message from the client to the server")
        (>! chan (str "here's a message from the client " t))
        (when-let [delta (<! tick-ch)]
          (recur delta))))))
