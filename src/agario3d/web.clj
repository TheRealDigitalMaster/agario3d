(ns agario3d.web
  (:require [compojure.core :refer [defroutes GET]]
            [compojure.route :refer [resources]]))

(defn index [req]
  {:status  200
   :headers {"Content-Type" "text/html"}
   :body    "and this seems to be working just fine"})

(defroutes app
  (GET "/" [] index)
  (resources "/"))