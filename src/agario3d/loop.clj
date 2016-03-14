(ns agario3d.loop
  (:require [clojure.core.async :refer [>! <! chan go-loop timeout]]))

(defn every [ms]
  (let [c (chan)]
    (go-loop []
      (<! (timeout ms))
      (when (>! c ms)
        (recur)))
    c))
