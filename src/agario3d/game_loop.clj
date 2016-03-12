(ns agario3d.game-loop
  (:require [clojure.core.async :refer [>! <! alts! chan close! go go-loop timeout]]
            [agario3d.game :refer [start-game update-game prep player-command]]))

(defn tick-every [ms]
  (let [c (chan)]
    (go-loop []
      (<! (timeout ms))
      (when (>! c :tick)
        (recur)))
    c))

(defn start-game-loop [ws-channel]
  (go
    (let [tick-ch (tick-every 200)]
      (loop [game (start-game)]
        (>! ws-channel (prep game))
          (when-let [[value port] (alts! [ws-channel tick-ch])]
            (condp = port
              ws-channel (recur (player-command game (:message value))) ;;this happens when we get a message from the client
              tick-ch (recur (update-game game))))))))  ;;this happens every tick of the game loop