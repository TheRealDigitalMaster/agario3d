(ns agario3d.game-loop
  (:require [clojure.core.async :refer [>! <! alts! chan close! go go-loop timeout]]
            [agario3d.game :refer [get-game update-game player-command]]))

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
      (loop [game (get-game)]
        (>! ws-channel game)
          (when-let [[value port] (alts! [ws-channel tick-ch])]
            (condp = port
              ws-channel (recur (player-command (:message value))) ;;this happens when we get a message from the client
              ;;this is wrong we don't want to update game every tick because this runs for
              ;;every connected player. We need a separate loop that runs once for all players
              tick-ch (recur (update-game))))))))  ;;this happens every tick of the game loop