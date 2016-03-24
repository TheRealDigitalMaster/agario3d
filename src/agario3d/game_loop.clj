(ns agario3d.game-loop
  (:require [clojure.core.async :refer [>! <! alts! chan close! go go-loop timeout]]
            [agario3d.loop :refer [every]]
            [agario3d.game :refer [add-player player-command]]))

(defn on-connect [ws-channel player]
  (go
    (let [tick-ch (every 200)]
      (loop [game (add-player player)]
        (>! ws-channel game)
          (when-let [[value port] (alts! [ws-channel tick-ch])]
            (condp = port
              ws-channel (recur (player-command (:message value))) ;;this happens when we get a message from the client
              tick-ch (recur (get-game player))))))))  ;;this happens every tick of the game loop
