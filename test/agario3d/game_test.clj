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

(expect 1 (swap! next-id inc))

