(ns agario3d.game-test
  (:require [agario3d.game :refer :all]
            [clojure.test :refer [use-fixtures]]
            [schema.core :as s]
            [schema.test :as st]
            [expectations :refer :all]))

(use-fixtures :once st/validate-schemas)

(expect [1000 1000 1000] (:dimensions config))

(expect config (s/validate Config config))

(expect 5 (radius->mass 5))

(expect "test" (radius->mass "test"))

(let [food (create-food)
      bot (create-bot)
      virus (create-virus)]
  (expect food (s/validate Agent food))
  (expect bot (s/validate Agent bot))
  (expect virus (s/validate Agent virus)))

(defn between [min max val]
  (and (>= val min) (<= val max)))

(let [min -500
      max 500
      pos (random-pos)]
  (doseq [ks (keys pos)]
    (expect true (between min max (ks pos))))
  (expect pos (s/validate Pos pos)))

