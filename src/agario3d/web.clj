(ns agario3d.web
  (:require [chord.http-kit :refer [with-channel]]
            [clojure.java.io :as io]
            [org.httpkit.server :refer [run-server]]
            [compojure.core :refer [defroutes GET]]
            [compojure.route :refer [resources]]
            [clojure.string :refer [split]]
            [clojure.walk :refer [keywordize-keys]]
            [agario3d.game-loop :refer [on-connect]]))

(defn init-server [game handler port]
  (defn- ws-handler [req]
    (with-channel req ws-channel
      (let [id (get (:headers req) "sec-websocket-key")
            qs (:query-string req)
            props (keywordize-keys 
                    (apply hash-map (split qs #"(&|=)")))
            player (assoc props :id id)]
        (prn (str "channel started " player))
        (on-connect game ws-channel player))))

  (defroutes app
    (GET "/ws" [] ws-handler)
    (GET "/" [] (slurp (io/resource "public/index.html")))
    (resources "/"))

  (let [server (run-server handler {:port port})]
    (println (str "Started server on localhost:" port))
    server))

