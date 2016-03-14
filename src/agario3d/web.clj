(ns agario3d.web
  (:require [chord.http-kit :refer [with-channel]]
            [clojure.java.io :as io]
            [compojure.core :refer [defroutes GET]]
            [compojure.route :refer [resources]]
            [agario3d.game-loop :refer [on-connect]]))

(defn- ws-handler [req]
  (with-channel req ws-channel
    (let [id (get (:headers req) "sec-websocket-key")
          name (:query-string req)]
      (prn (str "channel started " id " " name))
      (on-connect ws-channel {:name name :id id}))))

(defroutes app
  (GET "/ws" [] ws-handler)
  (GET "/" [] (slurp (io/resource "public/index.html")))
  (resources "/"))

