// ---------- HTML5 Canvas 60FPS Story Video Animation Engine ----------
(function() {
  function initCanvasAnimation() {
    const slides = document.querySelectorAll('.video-slide');
    if (!slides.length) return;

    slides.forEach((slide, slideIdx) => {
      const videoBox = slide.querySelector('.services-video-box');
      if (!videoBox) return;

      // Check if canvas already exists
      let canvas = videoBox.querySelector('.story-canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'story-canvas';
        canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2;';
        videoBox.appendChild(canvas);
      }

      const ctx = canvas.getContext('2d');
      let animFrameId = null;
      let frame = 0;

      // Rain particles for slide 2
      const raindrops = Array.from({ length: 45 }, () => ({
        x: Math.random() * 340,
        y: Math.random() * 540,
        length: Math.random() * 18 + 10,
        speed: Math.random() * 12 + 8,
        opacity: Math.random() * 0.5 + 0.3
      }));

      // Speed lines for slide 1
      const speedLines = Array.from({ length: 20 }, () => ({
        x: Math.random() * 340,
        y: Math.random() * 540,
        length: Math.random() * 40 + 20,
        speed: Math.random() * 15 + 10
      }));

      function resize() {
        canvas.width = videoBox.clientWidth || 340;
        canvas.height = videoBox.clientHeight || 540;
      }
      resize();

      function render() {
        if (!slide.classList.contains('active')) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          animFrameId = requestAnimationFrame(render);
          return;
        }

        const W = canvas.width;
        const H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        frame++;

        if (slideIdx === 0) {
          // --- SCENE 1: CUSTOMER WALKING INTO STORE & SCANNER BOOKING ---
          // 1. Sunbeam Morning Glow
          const grad = ctx.createRadialGradient(W * 0.2, H * 0.15, 10, W * 0.2, H * 0.15, 180);
          grad.addColorStop(0, 'rgba(255, 220, 150, 0.35)');
          grad.addColorStop(1, 'rgba(255, 220, 150, 0)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, W, H);

          // 2. Animated Laser Scan Line over counter parcel (0.3s loop)
          const laserY = H * 0.52 + Math.sin(frame * 0.08) * 35;
          ctx.strokeStyle = 'rgba(235, 30, 40, 0.85)';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#ff1a1a';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.moveTo(W * 0.25, laserY);
          ctx.lineTo(W * 0.75, laserY);
          ctx.stroke();
          ctx.shadowBlur = 0; // reset

          // 3. Animated Walking Silhouette / Customer figure moving to counter
          const walkCycle = Math.sin(frame * 0.12) * 6;
          const customerX = W * 0.18 + (Math.sin(frame * 0.03) + 1) * (W * 0.1);
          const customerY = H * 0.62 + walkCycle;

          // Customer glow pulse
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.beginPath();
          ctx.arc(customerX, customerY - 30, 22, 0, Math.PI * 2);
          ctx.fill();

          // 4. Booking Receipt Tag Printing Particle Effect
          if (frame % 40 < 20) {
            ctx.fillStyle = 'rgba(232, 163, 61, 0.9)';
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText('📄 TAGGED #DTDC-EXPRESS', W * 0.32, laserY - 10);
          }

        } else if (slideIdx === 1) {
          // --- SCENE 2: WAREHOUSE SCANNER & SCOOTER RIDER SPEED MOTION ---
          // 1. Moving Speed Lines
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 2;
          speedLines.forEach(l => {
            l.x -= l.speed;
            if (l.x < -l.length) {
              l.x = W + Math.random() * 40;
              l.y = Math.random() * H;
            }
            ctx.beginPath();
            ctx.moveTo(l.x, l.y);
            ctx.lineTo(l.x + l.length, l.y - 4);
            ctx.stroke();
          });

          // 2. High Speed Conveyor Scanner Light (Green Beam)
          const scannerX = W * 0.5 + Math.sin(frame * 0.1) * (W * 0.35);
          ctx.strokeStyle = 'rgba(0, 255, 128, 0.85)';
          ctx.shadowColor = '#00ff80';
          ctx.shadowBlur = 14;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(scannerX, H * 0.3);
          ctx.lineTo(scannerX, H * 0.75);
          ctx.stroke();
          ctx.shadowBlur = 0;

          // 3. Scooter Wheel Motion Ripple
          const wheelY = H * 0.72;
          const wheelX = W * 0.68;
          ctx.strokeStyle = 'rgba(232, 163, 61, 0.7)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(wheelX, wheelY, 18 + (frame % 10), 0, Math.PI * 2);
          ctx.stroke();

        } else if (slideIdx === 2) {
          // --- SCENE 3: ALL-WEATHER RAIN & DOORSTEP DELIVERY ---
          // 1. Falling Monsoon Rain Particles
          ctx.strokeStyle = 'rgba(180, 210, 255, 0.65)';
          ctx.lineWidth = 1.5;
          raindrops.forEach(r => {
            r.y += r.speed;
            r.x -= 2; // wind tilt
            if (r.y > H) {
              r.y = -r.length;
              r.x = Math.random() * (W + 50);
            }
            ctx.beginPath();
            ctx.moveTo(r.x, r.y);
            ctx.lineTo(r.x - 4, r.y + r.length);
            ctx.stroke();

            // Rain Splash on Ground
            if (r.y > H - 40 && Math.random() > 0.7) {
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
              ctx.beginPath();
              ctx.arc(r.x, H - 15, 3 + Math.random() * 4, 0, Math.PI);
              ctx.stroke();
            }
          });

          // 2. Doorstep Golden Warm Light Glow (Handover warmth)
          const glowGrad = ctx.createRadialGradient(W * 0.5, H * 0.45, 20, W * 0.5, H * 0.45, 160);
          glowGrad.addColorStop(0, 'rgba(255, 200, 100, 0.28)');
          glowGrad.addColorStop(1, 'rgba(255, 200, 100, 0)');
          ctx.fillStyle = glowGrad;
          ctx.fillRect(0, 0, W, H);
        }

        animFrameId = requestAnimationFrame(render);
      }

      window.addEventListener('resize', resize);
      render();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCanvasAnimation);
  } else {
    initCanvasAnimation();
  }
})();
