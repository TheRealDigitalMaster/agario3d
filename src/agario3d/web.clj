(ns agario3d.web
  (:require [compojure.core :refer [defroutes GET]]
            [compojure.route :refer [resources]]))

(defn index [req]
  {:status  200
   :headers {"Content-Type" "text/html"}
   :body    "just need to reset from the repl to take effect"})

(defroutes app
  (GET "/" [] index)
  (resources "/"))