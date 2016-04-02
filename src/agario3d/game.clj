(ns agario3d.game
  (:require [clojure.core.async :refer [>! <! alts! chan close! go go-loop timeout]]
            [schema.core :as s]
            [agario3d.config :refer [config]]
            [clojure.math.numeric-tower :refer [expt]]
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

(def pi (. Math PI))

(s/defn euclidean-distance :- s/Num
  [p1 :- Pos p2 :- Pos]
  (let [dx (expt (- (:x p2) (:x p1)) 2)
        dy (expt (- (:y p2) (:y p1)) 2)
        dz (expt (- (:z p2) (:z p1)) 2)]
    (-> (+ dx dy dz)
        (expt ,, (/ 1 2)))))

(s/defn contains? :- s/Bool 
  [a1 :- Agent a2 :- Agent]
  (let [d (euclidean-distance a1 a2)]
    (-> (+ d (:r a2))
        (< ,, (:r a1)))))

(s/defn mass->radius :- s/Num
  [mass :- s/Num]
  (-> mass
      (/ ,, (* pi (/ 4 3)))
      (expt ,, (/ 1 3))))

(s/defn radius->mass :- s/Num 
  [radius :- s/Num]
  (-> radius
      (expt ,,, 3)
      (* ,, pi)
      (* ,, (/ 4 3))))

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

(s/defn things-of-type :- [Agent]
  [game :- s/Any t :- s/Keyword]
  (filter (fn [[k v]] (= t (:t v))) game))

(defn eat [eater eatee]
  (let [mass (+ (:m eater) (:m eatee))]
    (assoc eater :m mass :r (mass->radius mass))))

(defn get-collisions [game]
  (let [players (things-of-type game :player)
        bots (things-of-type game :bot)
        agents (concat players bots)
        food (things-of-type game :food)
        both (concat agents food)]
    (for [a agents
          b both
          :when (and (not= a b) (contains? a b))]
      [a b])))

(defn perform-collisions [game]
  (let [collisions (get-collisions game)]
    (reduce 
      (fn [g [eater eatee]]
        (prn "nom nom nom")
        (-> g
            (dissoc ,, (:id eatee))
            (assoc ,, (:id eater) (eat eater eatee)))) game collisions)))

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
           (reduce (fn [g a] (assoc g (:id a) a)) {:snapshot {}} agents))))

(defn create-snapshot [game]
  (->> (reduce (fn [snap [k v]]
                 (assoc snap k v)) {} game)
        (assoc game :snapshot ,,,)))

(defn create-diff [s game]
    (reduce (fn [diff [k v]]
                   (let [snap-val (get k s)]
                     (if (and (not= :snapshot k) 
                              (or (nil? snap-val) (not= snap-val v)))
                       (assoc diff k v)
                       diff))
                   ) {} game))

(defn move-bots [game])

(defn move-food [game])

(defn replenish-bots [game])

(defn replenish-food [game])

(defn update-game [game delta]
  (let [snap (:snapshot @game)]
    (->> (swap! game
                (fn [g]
                  (-> g
                      move-bots
                      move-food
                      replenish-bots
                      replenish-food
                      perform-collisions
                      create-snapshot)))
         (create-diff snap ,,,))))

(defn start-game [game]
  (go
    (let [tick (every (/ 1000 (:updatesPerSecond config)))]
      (loop [game game]
        (let [delta (<! tick)]
          (recur (update-game game delta)))))))

(defn update-player-position [game command]
  (if-let [player (get @game (:id command)) ]
    (let [updated (merge player command)]
      (swap! game assoc (:id command) updated)
      game)
    game))

(defn player-command [game command]
  (case (:type command)
    :position (update-player-position game command)
    game))

(defn add-player [game player]
  (let [p (create-player player)]
    (swap! game assoc (:id p) p)
    game))

(defn remove-player [game {id :id}]
  (swap! game dissoc id)
  game)

