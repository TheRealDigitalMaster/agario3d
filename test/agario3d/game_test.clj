(ns agario3d.game-test
  (:require [agario3d.game :refer :all]
            [agario3d.config :refer :all]
            [clojure.test :refer [is testing use-fixtures]]
            [clojure.math.numeric-tower :refer [expt]]
            [schema.core :as s]
            [schema.test :as st]
            [expectations :refer :all]))

(use-fixtures :once st/validate-schemas)

(expect [1000 1000 1000] (:dimensions config))

(expect config (s/validate Config config))

(expect 523.5987755982987 (radius->mass 5))

(expect 5.0 (mass->radius 523.5987755982987))

(expect 3.7416573867739413 (euclidean-distance {:x 1 :y 1 :z 1} {:x 2 :y 3 :z 4}))

(let [g (create-new-game)
      b (things-of-type @g :bot)
      f (things-of-type @g :food)]
  (expect (get-in config [:bots :num]) (count b))
  (expect (get-in config [:food :num]) (count f)))

(let [a1 {:r 5 :x 0 :y 0 :z 0}
      a2 {:r 4 :x 0 :y 0 :z 0}]
  (expect (contains? a1 a2)))

(doseq [a [(create-food) (create-bot) (create-virus)]]
  (expect a (s/validate Agent a)))

(defn between [min max val]
  (and (>= val min) (<= val max)))

(let [min -500
      max 500
      pos (random-pos)]
  (doseq [ks (keys pos)]
    (expect true (between min max (ks pos))))
  (expect pos (s/validate Pos pos)))

(let [agents (create-agents 5 create-food)]
  (expect 5 (count agents)))

(let [game (create-new-game)
      foodNum (get-in config [:food :num])
      botNum (get-in config [:bots :num])
      virusNum (get-in config [:viruses :num])
      items (count (keys @game))]
  (expect items (+ foodNum botNum virusNum)))

(let [p (create-player {:id "123"
                        :colour "0xff0000"
                        :name "jelfs"})]
  (expect p (s/validate Agent p))
  (expect "123" (:id p))
  (expect "0xff0000" (:c p))
  (expect "jelfs" (:n p))
  (expect :player (:t p))
  (expect (:startRadius config) (:r p)))

(let [g (-> (create-new-game)
            (add-player ,,, {:id "123"
                             :colour "0xff0000"
                             :name "jelfs"}))]
  (expect (get @g "123")))

(let [g (-> (create-new-game)
            (add-player ,,, {:id "123"
                             :x 100
                             :y 100
                             :z 100}))
      g2 (update-player-position g {:id "123" :x 200 :y 300 :z 400})
      p (get @g2 "123")]
  (expect 200 (:x p))
  (expect 300 (:y p))
  (expect 400 (:z p)))

(expect 123 (player-command 123 {:type :unknown}))

