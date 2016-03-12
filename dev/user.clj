(ns user
  (:require [reloaded.repl :refer [system reset stop]]
            [agario3d.system]))

(reloaded.repl/set-init! #'agario3d.system/create-system)