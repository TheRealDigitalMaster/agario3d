(ns agario3d.game-test
  (:require [agario3d.game :refer :all]
            [agario3d.config :refer :all]
            [clojure.test :refer [is testing use-fixtures]]
            [schema.core :as s]
            [schema.test :as st]
            [expectations :refer :all]))

(use-fixtures :once st/validate-schemas)

(expect [1000 1000 1000] (:dimensions config))

(expect config (s/validate Config config))

(expect 5 (radius->mass 5))

(expect "test" (radius->mass "test"))

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
      items (count (keys game))]
  (expect items (+ foodNum botNum virusNum)))
