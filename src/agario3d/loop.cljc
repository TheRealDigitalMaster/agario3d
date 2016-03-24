(ns agario3d.loop
  #?(:clj (:require [clojure.core.async :refer [>! <! chan go timeout]]))
  #?(:cljs (:require [cljs.core.async :refer [>! <! chan timeout]]))
  #?(:cljs (:require-macros [cljs.core.async.macros :refer [go]])))

(defn every [ms]
 (let [c (chan)]
  (go
   (loop []
    (<! (timeout ms))
    (when (>! c ms)
     (recur))))
  c))
