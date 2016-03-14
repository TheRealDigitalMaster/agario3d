(ns agario3d.game
  (:require [clojure.core.async :refer [>! <! alts! chan close! go go-loop timeout]]
            [agario3d.loop :refer [every]]))

(def config { :dimensions [1000 1000 1000]
             :startRadius 30
             :movingFood true
             :food { :num 500
                    :radius 10 }
             :bots { :num 20
                    :colour 0x0000ff }
             :viruses { :num 20
                       :radius 50
                       :colour 0x00ff00 }
             :updatesPerSecond 60 })

(def game (atom {}))

(defn get-game [player]
  (prn (str  "get-game called - for " (:name player)))
  @game)

(defn update-game [delta]
  (swap! game assoc :game (inc (:game @game))))

(defn start-game []
  (go
    (let [tick (every 1000)]
      (loop [game (swap! game assoc :game 0)]
        (let [delta (<! tick)]
          (prn (str "performing an update of the game state after " delta))
          (recur (update-game delta)))))))

(defn player-command [command]
  @game)

(defn add-player [player]
  @game)


