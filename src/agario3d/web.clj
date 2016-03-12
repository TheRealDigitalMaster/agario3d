(ns agario3d.web
  (:require [chord.http-kit :refer [with-channel]]
            [clojure.java.io :as io]
            [compojure.core :refer [defroutes GET]]
            [compojure.route :refer [resources]]
            [agario3d.game-loop :refer [start-game-loop]]))

(defn- ws-handler [req]
  (with-channel req ws-channel
    (let [id (get (:headers req) "sec-websocket-key")
          name (:query-string req)]
    (prn (str "channel started " id " " name))
    (start-game-loop ws-channel))))

(defroutes app
  (GET "/ws" [] ws-handler)
  (GET "/" [] (slurp (io/resource "public/index.html")))
  (resources "/"))