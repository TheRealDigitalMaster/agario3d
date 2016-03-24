(ns agario3d.game
  (:require [clojure.core.async :refer [>! <! alts! chan close! go go-loop timeout]]
            [schema.core :as s]
            [agario3d.config :refer [config]]
            [agario3d.loop :refer [every]]))

(def Pos
  "Scheme for position vector"
  {:x s/Num :y s/Num :z s/Num})

(def Agent
  "Schema for an agent in the game"
  {:c s/Str
   (s/optional-key :n) s/Str
   :id s/Any  ;;this could be a string or a num
   :t s/Keyword
   :r s/Num
   :m s/Num
   :x s/Num
   :y s/Num
   :z s/Num})

(def next-id (atom 0))

(s/defn radius->mass :- s/Num 
  [radius :- s/Num]
  radius)

(s/defn random-coord :- s/Num
  [limit]
  (-> (rand)
      (- ,, 0.5)
      (* ,, limit)))

(s/defn random-pos :- Pos
  []
  (let [[x y z] (:dimensions config)]
    {:x (random-coord x)
     :y (random-coord y)
     :z (random-coord z)}))

(s/defn create-food  :- Agent []
  (let [radius (get-in config [:food :radius])]
    (merge  {:c "0xffffff"
             :id (swap! next-id inc)
             :t :food
             :r radius
             :m (radius->mass radius)} (random-pos))))

(s/defn create-virus  :- Agent []
  (let [radius (get-in config [:viruses :radius])]
    (merge  {:c (get-in config [:viruses :colour])             
             :id (swap! next-id inc)
             :t :virus
             :r radius
             :m (radius->mass radius)} (random-pos))))

(s/defn create-bot  :- Agent []
  (let [radius (:startRadius config)]
    (merge  {:c (get-in config [:bots :colour])
             :id (swap! next-id inc)
             :t :bot
             :r radius
             :m (radius->mass radius)} (random-pos))))

(s/defn create-player  :- Agent [player]
  (let [radius (:startRadius config)]
    (merge  {:c (:colour player)
             :n (:name player)
             :id (:id player)
             :t :player
             :r radius
             :m (radius->mass radius)} (random-pos))))

(s/defn create-agents :- [Agent] [n agentFn]
  (map (fn [n] (agentFn)) (range n)))

(defn create-new-game
  "Seed the game with food, viruses and bots"
  []
  (prn "creating a brand new game")
  (atom  (let [foodNum (get-in config [:food :num])
               botNum (get-in config [:bots :num])
               virusNum (get-in config [:viruses :num])
               agents (concat (create-agents foodNum create-food)
                              (create-agents botNum create-bot)
                              (create-agents virusNum create-virus))]
           (reduce (fn [g a] (assoc g (:id a) a)) {} agents))))

(defn update-game [game delta]
  (swap! game assoc :game (inc (:game @game))))

(defn start-game [game]
  (go
    (let [tick (every (/ 1000 (:updatesPerSecond config)))]
      (loop [game game]
        (let [delta (<! tick)]
          (prn (str "performing an update of the game state after " delta))
          (recur (update-game game delta)))))))

(defn player-command [game command]
  game)

(defn add-player [game player]
  (let [p (create-player player)]
    (prn (str "added player " player))
    (swap! game assoc (:id p) p)))

