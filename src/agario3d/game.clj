(ns agario3d.game)

(def game (atom {}))

(defn get-game []
    @game)

(defn start-game []
    (swap! game assoc :game 0))

(defn update-game []
    (swap! game assoc :game (inc (:game @game))))

(defn player-command [command]
    @game)