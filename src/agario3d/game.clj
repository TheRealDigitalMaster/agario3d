(ns agario3d.game
  (:require [clojure.core.async :refer [>! <! alts! chan close! go go-loop timeout]]
            [schema.core :as s]
            [agario3d.loop :refer [every]]))

(def Config 
  "Schema for the config"
  {:dimensions [s/Num]
   :startRadius s/Num
   :movingFood s/Bool
   :food {:num s/Num
          :radius s/Num }
   :bots {:num s/Num
          :colour s/Num}
   :viruses {:num s/Num
             :radius s/Num
             :colour s/Num}
   :updatesPerSecond s/Num})

(def Agent
  "Schema for an agent in the game"
  {:c s/Num
   :id s/Num
   :t s/Keyword
   :r s/Num
   :m s/Num
   :x s/Num
   :y s/Num
   :z s/Num})

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
(def next-id (atom 0))

(s/defn radius->mass :- s/Num 
  [radius :- s/Num]
  radius)

(s/defn createFood  :- Agent []
  (let [radius (get-in config [:food :radius])]
    {:c 0xffffff
     :id (swap! next-id inc)
     :t :food
     :r radius
     :m (radius->mass radius)
     :x 0
     :y 0
     :z 0}))

(defn create-new-game
  "Seed the game with food, viruses and bots"
  []
  (swap! game (fn [g]
                
                )))

(defn get-game [player]
  (prn (str  "get-game called - for " (:name player)))
  @game)

(defn update-game [delta]
  (swap! game assoc :game (inc (:game @game))))

(defn start-game []
  (go
    (let [tick (every (/ 1000 (:updatesPerSecond config)))]
      (loop [game (create-new-game)]
        (let [delta (<! tick)]
          (prn (str "performing an update of the game state after " delta))
          (recur (update-game delta)))))))

(defn player-command [command]
  @game)

(defn add-player [player]
  @game)


