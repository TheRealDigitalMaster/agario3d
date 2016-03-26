(defproject agario3d "0.1.0-SNAPSHOT"
  :description "An attempt at a 3D version of agar.io written in clojure and webgl"
  :url "https://github.com/julianjelfs/agario3d"
  :license {:name "GNU General Public License"
            :url "http://www.gnu.org/licenses/gpl.html"}
  :jvm-opts ["-XX:MaxPermSize=256m"]
  :main agario3d.system
  :dependencies [[org.clojure/clojure "1.7.0"]
                 [org.clojure/clojurescript "0.0-3308"]
                 [http-kit "2.1.18"]
                 [com.stuartsierra/component "0.2.3"]
                 [compojure "1.3.4"]
                 [org.clojure/math.numeric-tower "0.0.4"]
                 [expectations "2.1.2"]
                 [jarohen/chord "0.7.0"]
                 [prismatic/schema "1.0.5"]
                 [org.clojure/core.async "0.2.374"]]
  :profiles {:dev {:plugins [[lein-cljsbuild "1.0.6"]
                             [lein-figwheel "0.3.7"]
                             [lein-autoexpect "1.7.0"]]
                   :dependencies [[reloaded.repl "0.1.0"]]
                   :source-paths ["dev"]
                   :cljsbuild {:builds [{:source-paths ["src" "dev"]
                                         :figwheel true
                                         :compiler {:output-to "target/classes/public/app.js"
                                                    :output-dir "target/classes/public/out"
                                                    :optimizations :none
                                                    :recompile-dependents true
                                                    :source-map true}}]}}})
