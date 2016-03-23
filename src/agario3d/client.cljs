(ns agario3d.client
  (:require [chord.client :refer [ws-ch]]
            [cljs.core.async :refer [<!]])
  (:require-macros [cljs.core.async.macros :refer [go]]))

(def container (.getElementById js/document "container"))

(defonce run-once ;; not every figwheel reload
  (go
    (let [{:keys [ws-channel error]} (<! (ws-ch "ws://localhost:9009/ws?name=julian&colour=0xff0000"))]
      (when error (throw error))
      (loop []
        (when-let [game (:message (<! ws-channel))]
          (prn game)
          (cond
            (:dead? game) (set! (.-className (.-body js/document)) "game-over")
            (:safe? game) (set! (.-location js/document) "/safe.html")
            :else (recur)))))))
