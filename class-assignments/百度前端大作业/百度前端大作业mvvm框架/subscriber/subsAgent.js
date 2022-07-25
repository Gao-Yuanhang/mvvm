class SubsAgent{
    constructor(){
        this.subscribers = []
    }

    addSubs(subs){
        this.subscribers.push(subs)
    }

    notifyAllSubs(oldVal){
        this.subscribers.map(subs=>{
            subs.update(oldVal)
        })
    }
}

export default SubsAgent