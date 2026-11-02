// Durations use game time: pauses, dialogs and hidden tabs freeze the skill.
(() => {
  class KebabRide {
    constructor({duration=5,cooldown=10,speed=245}={}){this.duration=duration;this.cooldown=cooldown;this.speed=speed;this.reset();}
    reset(){this.phase='ready';this.remaining=0;}
    get active(){return this.phase==='riding';}
    activate(){if(this.phase!=='ready')return false;this.phase='riding';this.remaining=this.duration;return true;}
    tick(dt){
      let expired=false,remainingDt=Math.max(0,Number.isFinite(dt)?dt:0);
      while(this.phase!=='ready'&&remainingDt>0){
        const used=Math.min(remainingDt,this.remaining);this.remaining-=used;remainingDt-=used;
        if(this.remaining<=1e-8){if(this.active){expired=true;this.phase='cooldown';this.remaining=this.cooldown;}else{this.phase='ready';this.remaining=0;}}
      }
      return expired;
    }
  }
  window.KebabRide=KebabRide;
})();
