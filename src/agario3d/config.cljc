(ns agario3d.config
  (:require [schema.core :as s]))

(def Config 
  "Schema for the config"
  {:dimensions [s/Num]
   :port s/Num
   :startRadius s/Num
   :movingFood s/Bool
   :food {:num s/Num
          :radius s/Num }
   :bots {:num s/Num
          :colour s/Str}
   :viruses {:num s/Num
             :radius s/Num
             :colour s/Str}
   :updatesPerSecond s/Num})

(def config { :dimensions [1000 1000 1000]
             :port 9009
             :startRadius 30
             :movingFood true
             :food { :num 500
                    :radius 10 }
             :bots { :num 20
                    :colour "0x0000ff" }
             :viruses { :num 20
                       :radius 50
                       :colour "0x00ff00" }
             :updatesPerSecond 60 })
