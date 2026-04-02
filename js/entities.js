class Particle {
    constructor(x, y, vx, vy, size, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.size = Math.max(1, size);
        this.color = color;
        this.alpha = 1;
        this.markedForDeletion = false;
    }
    update() {
        this.x += this.vx - state.currentSpeed; 
        this.y += this.vy;
        this.alpha -= 0.04;
        this.size *= 0.95;
        if (this.alpha <= 0 || this.size < 0.2) this.markedForDeletion = true;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Cloud {
    constructor() {
        this.width = 100 + Math.random() * 60;
        this.height = 40 + Math.random() * 20;
        this.x = canvas.width + Math.random() * 100;
        this.y = Math.random() * (canvas.height / 2 - this.height);
        this.speed = (Math.random() * 0.5 + 0.1) * (state.currentSpeed * 0.2);
        this.markedForDeletion = false;
    }

    update() {
        if (state.current !== GAME_STATE.PLAYING) return;
        this.x -= this.speed;
        if (this.x + this.width < 0) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.85; 
        
        ctx.beginPath();
        ctx.arc(this.width * 0.2, this.height * 0.7, this.height * 0.3, Math.PI * 0.5, Math.PI * 1.5);
        ctx.arc(this.width * 0.45, this.height * 0.4, this.height * 0.4, Math.PI, Math.PI * 2);
        ctx.arc(this.width * 0.75, this.height * 0.5, this.height * 0.3, Math.PI, Math.PI * 2);
        ctx.arc(this.width * 0.85, this.height * 0.75, this.height * 0.25, Math.PI * 1.5, Math.PI * 0.5);
        ctx.closePath(); 
        ctx.fill();
        
        ctx.restore();
    }
}
