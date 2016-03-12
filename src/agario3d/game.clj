(ns agario3d.game)


(defn start-game []
    {:game 0})

(defn update-game [game]
    (assoc game :game (inc (:game game))))

(defn prep [game]
    game)

(defn player-command [game command]
    game)