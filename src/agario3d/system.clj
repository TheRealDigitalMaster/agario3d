(ns agario3d.system
  (:require [com.stuartsierra.component :as component]
            [org.httpkit.server :refer [run-server]]
            [agario3d.web :refer [app]]
            [agario3d.config :refer [config]]
            [agario3d.game :refer [create-new-game]]))

(defn- start-server [handler port]
  (let [server (run-server handler {:port port})]
    (println (str "Started server on localhost:" port))
    server))

(defn- stop-server [server]
  (when server
    (server))) ;; run-server returns a fn that stops itself

(defrecord Agario3D []
  component/Lifecycle
  (start [this]
    (-> this
        (assoc ,,, :server (start-server #'app 9009))
        (assoc ,,, :config config)
        (assoc ,,, :game (create-new-game))))
  (stop [this]
    (stop-server (:server this))
    (dissoc this :server)))

(defn create-system []
  (Agario3D.))

(defn -main [& args]
  (.start (create-system)))
