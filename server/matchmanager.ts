import Match from "./match";

export default class MatchManager {
    private matches: Match[] = [];
    private matchQueue: Match[] = [];

    constructor() {

    }

    getAvailableMatch(): Match {
        if (this.matchQueue[0] !== undefined) {
            let match = this.matchQueue[0];
            if (match.playerCount == 1) {
                this.matchQueue.shift();
            }
            return match;
        }

        let newMatch = new Match();
        this.matchQueue.push(newMatch);
        this.matches.push(newMatch);

        return newMatch;
    }
}