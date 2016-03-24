(ns agario3d.system
  (:require [com.stuartsierra.component :as component]
            [agario3d.web :refer [app init-server]]
            [agario3d.config :refer [config]]
            [agario3d.game :refer [create-new-game]]))

(defn- start-server [game handler port]
  (init-server game handler port))

(defn- stop-server [server]
  (when server
    (server))) ;; run-server returns a fn that stops itself

(defrecord Agario3D []
  component/Lifecycle
  (start [this]
    (let [game (create-new-game)]
    (-> this
        (assoc ,,, :server (start-server game #'app (:port config)))
        (assoc ,,, :config config)
        (assoc ,,, :game game))))
  (stop [this]
    (stop-server (:server this))
    (dissoc this :server :config :game)))

(defn create-system []
  (Agario3D.))

(defn -main [& args]
  (.start (create-system)))
