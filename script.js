// --- Scramble Text Effect ---
function createScrambler() {
  const state = {
    maxRandomizationSteps: 12,
    originalText: '',
    scrambledText: '',
    counters: [],
    callback: null,
    animationId: null,
    cycleCounter: 0,
  };

  const characterSets = ['@', '#', '$', '%', '£', '&', '*', '§', '+', '_'].concat('abcdefghijklmnopqrstuvwxyz'.split(''));

  const generateRandom = (length) => 
    Array.from({ length }, () => characterSets[Math.floor(Math.random() * characterSets.length)]).join('');

  const generateCounters = (length) => 
    Array.from({ length }, () => Math.floor(Math.random() * state.maxRandomizationSteps) + 1);

  const updateText = (newText) => {
    state.scrambledText = newText;
    if (state.callback) state.callback(newText);
  };

  const animate = (step) => {
    if (state.cycleCounter === 0) step();
    state.cycleCounter = (state.cycleCounter + 1) % 3;
    state.animationId = requestAnimationFrame(() => animate(step));
  };

  const scrambleText = (text, callback) => {
    Object.assign(state, { originalText: text, scrambledText: '', callback, cycleCounter: 0 });
    state.counters = generateCounters(text.length);

    animate(() => {
      if (state.scrambledText.length !== text.length) {
        updateText(generateRandom(state.scrambledText.length < text.length ? state.scrambledText.length + 1 : text.length));
      } else if (state.scrambledText !== text) {
        updateText(state.counters.map((count, i) => 
          count > 0 ? (state.counters[i]--, generateRandom(1)) : text[i]
        ).join(''));
      } else {
        cancelAnimationFrame(state.animationId);
      }
    });
  };

  return {
    updateMaxRandomizationSteps: (steps) => state.maxRandomizationSteps = steps,
    resetScrambler: () => Object.assign(state, { originalText: '', scrambledText: '', counters: [], callback: null, animationId: null, cycleCounter: 0 }),
    scrambleText,
  };
}

function scrambleElements(className) {
  const elements = document.querySelectorAll(className);
  let scramblerInstances = [];

  elements.forEach((element, index) => {
    const scrambler = createScrambler();
    scramblerInstances[index] = scrambler;
    const initialText = element.textContent || '';

    scrambler.scrambleText(
      initialText,
      (updatedText) => {
        element.textContent = updatedText;
      }
    );
  });
}

// Initialize scramble effect on page load
document.addEventListener('DOMContentLoaded', () => {
  scrambleElements('.scramble-on-page-load');
  
  // Hamburger menu functionality
  const hamburgerMenu = document.querySelector('.hamburger-menu');
  const nav = document.querySelector('.nav');
  
  if (hamburgerMenu && nav) {
    hamburgerMenu.addEventListener('click', () => {
      hamburgerMenu.classList.toggle('active');
      nav.classList.toggle('active');
    });
    
    // Close menu when clicking on nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        hamburgerMenu.classList.remove('active');
        nav.classList.remove('active');
      });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!hamburgerMenu.contains(e.target) && !nav.contains(e.target)) {
        hamburgerMenu.classList.remove('active');
        nav.classList.remove('active');
      }
    });
  }
  
  // Global click handler to prevent link clicks during carousel dragging
  document.addEventListener('click', (e) => {
    const carouselContainer = e.target.closest('.carousel-container');
    if (carouselContainer && carouselContainer.carouselInstance) {
      const carousel = carouselContainer.carouselInstance;
      const timeSinceStart = Date.now() - carousel.dragStartTime;
      const hasMovedSignificantly = carousel.totalMovement > 10;
      const recentlyDragged = timeSinceStart < 300;
      
      if (carousel.isDragging || (hasMovedSignificantly && recentlyDragged)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    }
  }, true);
});

// --- Generic Carousel System ---
class Carousel {
  constructor(containerId, slides, backgroundClasses = []) {
    this.container = document.getElementById(containerId);
    this.slides = slides;
    this.backgroundClasses = backgroundClasses;
    this.slideIndex = 0;
    this.dotsContainer = document.getElementById(`${containerId}-dots`);
    
    // Touch/swipe properties
    this.isDragging = false;
    this.startPos = 0;
    this.startPosY = 0;
    this.currentTranslate = 0;
    this.prevTranslate = 0;
    this.animationID = 0;
    this.currentIndex = 0;
    this.totalMovement = 0;
    this.totalMovementY = 0;
    this.dragStartTime = 0;
    this.isHorizontalSwipe = false;

    this.init();
  }

  init() {
    this.createSlidingStructure();
    this.buildDots();
    this.setSlide(0);
    this.setupTouchEvents();
    window.addEventListener('resize', () => this.setSlide(this.slideIndex));
    
    // Store reference to this carousel instance on the container for global click handling
    this.container.carouselInstance = this;
  }

  createSlidingStructure() {
    // Store original content
    const originalContent = this.container.innerHTML;
    
    // Create slides container
    const slidesContainer = document.createElement('div');
    slidesContainer.className = 'carousel-slides';
    
    // Create individual slides
    this.slides.forEach((slide, index) => {
      const slideElement = document.createElement('a');
      slideElement.className = `carousel-slide ${slide.bg || ''}`.trim();
      slideElement.href = slide.link || '#';
      
      // Prevent link clicks when dragging or recently dragged
      slideElement.addEventListener('click', (e) => {
        const timeSinceStart = Date.now() - this.dragStartTime;
        const hasMovedSignificantly = this.totalMovement > 10; // 10px threshold
        const recentlyDragged = timeSinceStart < 300; // 300ms window
        
        if (this.isDragging || (hasMovedSignificantly && recentlyDragged)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
      });
      
      // Image-only slide content
      const img = document.createElement('img');
      img.className = 'card-img';
      img.alt = slide.alt || '';

      // Build responsive sources if provided
      if (slide.image) {
        // Option A: Explicit path (no srcset)
        if (slide.image.path) {
          img.src = slide.image.path;
        } else {
          // Option B: Build from parts
          const card = slide.image.card || '';
          const name = slide.image.name || '';
          const widths = slide.image.widths || [400, 600, 800, 1000, 1200, 1600, 2000];
          const ext = slide.image.ext || 'webp';
          const base = `public/img/${card}/${name}`;
          const srcset = widths
            .map((w) => `${base}-${w}w.${ext} ${w}w`)
            .join(', ');
          img.setAttribute('srcset', srcset);
          // Default sizes matching request
          const sizes = slide.image.sizes || '(max-width: 400px) 400px, (max-width: 600px) 600px, (max-width: 800px) 800px, (max-width: 1000px) 1000px, (max-width: 1200px) 1200px, (max-width: 1600px) 1600px, (min-width: 1601px) 2000px';
          img.setAttribute('sizes', sizes);
          const fallbackWidth = slide.image.fallbackWidth || 1000;
          img.src = `${base}-${fallbackWidth}w.${ext}`;
          if (slide.image.width) img.width = slide.image.width;
          if (slide.image.height) img.height = slide.image.height;
        }
      }

      slideElement.appendChild(img);
      
      slidesContainer.appendChild(slideElement);
    });
    
    // Replace container content
    this.container.innerHTML = '';
    this.container.appendChild(slidesContainer);
    this.slidesContainer = slidesContainer;
  }

  buildDots() {
    this.slides.forEach((_, i) => {
      const button = document.createElement("button");
      button.className = "dot";
      button.type = "button";
      button.setAttribute("aria-label", `Go to slide ${i + 1}`);
      button.addEventListener("click", () => this.setSlide(i));
      this.dotsContainer.appendChild(button);
    });
  }

  setSlide(i) {
    this.slideIndex = (i + this.slides.length) % this.slides.length;
    
    // Slide to the correct position (pixels to avoid fractional widths)
    const translatePx = -this.slideIndex * this.container.offsetWidth;
    this.slidesContainer.style.transform = `translateX(${translatePx}px)`;

    // Update dots
    [...this.dotsContainer.children].forEach((dot, idx) =>
      dot.setAttribute(
        "aria-current",
        idx === this.slideIndex ? "true" : "false"
      )
    );
    
    // Update translate position for touch/swipe
    this.prevTranslate = -this.slideIndex * this.container.offsetWidth;
    this.currentTranslate = this.prevTranslate;
    
    // Reset dragging state
    this.isDragging = false;
  }

  setupTouchEvents() {
    // Touch events
    this.container.addEventListener('touchstart', (e) => this.touchStart(e));
    this.container.addEventListener('touchmove', (e) => this.touchMove(e));
    this.container.addEventListener('touchend', (e) => this.touchEnd(e));
    
    // Mouse events
    this.container.addEventListener('mousedown', (e) => this.mouseDown(e));
    
    // Prevent context menu on long press
    this.container.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  getPositionX(event) {
    return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
  }

  getPositionY(event) {
    return event.type.includes('mouse') ? event.pageY : event.touches[0].clientY;
  }

  touchStart(event) {
    this.startPos = this.getPositionX(event);
    this.startPosY = this.getPositionY(event);
    this.isDragging = true;
    this.totalMovement = 0;
    this.totalMovementY = 0;
    this.isHorizontalSwipe = false;
    this.dragStartTime = Date.now();
    this.animationID = requestAnimationFrame(this.animation.bind(this));
    this.container.style.cursor = 'grabbing';
  }

  mouseDown(event) {
    event.preventDefault();
    event.stopPropagation();
    
    this.startPos = this.getPositionX(event);
    this.isDragging = true;
    this.totalMovement = 0;
    this.dragStartTime = Date.now();
    this.container.style.cursor = 'grabbing';
    
    // Add event listeners for mouse move and up
    document.addEventListener('mousemove', this.mouseMove.bind(this));
    document.addEventListener('mouseup', this.mouseUp.bind(this));
  }

  touchMove(event) {
    if (!this.isDragging) return;
    
    const currentPosition = this.getPositionX(event);
    const currentPositionY = this.getPositionY(event);
    const diffX = currentPosition - this.startPos;
    const diffY = currentPositionY - this.startPosY;
    const containerWidth = this.container.offsetWidth;
    
    // Track total movement for click prevention
    this.totalMovement = Math.abs(diffX);
    this.totalMovementY = Math.abs(diffY);
    
    // Determine if this is a horizontal swipe
    if (!this.isHorizontalSwipe && (this.totalMovement > 10 || this.totalMovementY > 10)) {
      this.isHorizontalSwipe = this.totalMovement > this.totalMovementY;
    }
    
    // Only handle horizontal swipes and prevent default for those
    if (this.isHorizontalSwipe) {
      event.preventDefault();
      
      this.currentTranslate = this.prevTranslate + diffX;
      
      // Limit the drag range
      const maxTranslate = 0;
      const minTranslate = -(this.slides.length - 1) * containerWidth;
      this.currentTranslate = Math.max(minTranslate, Math.min(maxTranslate, this.currentTranslate));
      
      this.setSliderPosition(this.currentTranslate);
    } else if (this.totalMovementY > 10) {
      // This is a vertical swipe, stop carousel interaction
      this.isDragging = false;
      cancelAnimationFrame(this.animationID);
      this.container.style.cursor = 'grab';
    }
  }

  mouseMove(event) {
    if (!this.isDragging) return;
    const currentPosition = this.getPositionX(event);
    const diff = currentPosition - this.startPos;
    const containerWidth = this.container.offsetWidth;
    
    // Track total movement for click prevention
    this.totalMovement = Math.abs(diff);
    
    this.currentTranslate = this.prevTranslate + diff;
    
    // Limit the drag range
    const maxTranslate = 0;
    const minTranslate = -(this.slides.length - 1) * containerWidth;
    this.currentTranslate = Math.max(minTranslate, Math.min(maxTranslate, this.currentTranslate));
    
    this.setSliderPosition(this.currentTranslate);
  }

  touchEnd(event) {
    this.isDragging = false;
    cancelAnimationFrame(this.animationID);
    this.container.style.cursor = 'grab';
    
    // Only process slide changes for horizontal swipes
    if (this.isHorizontalSwipe) {
      const movedBy = this.currentTranslate - this.prevTranslate;
      const containerWidth = this.container.offsetWidth;
      const threshold = containerWidth * 0.15; // 15% threshold for slide change (more sensitive)
      
      if (Math.abs(movedBy) > threshold) {
        if (movedBy > 0 && this.slideIndex > 0) {
          // Swipe right - go to previous slide
          this.setSlide(this.slideIndex - 1);
        } else if (movedBy < 0 && this.slideIndex < this.slides.length - 1) {
          // Swipe left - go to next slide
          this.setSlide(this.slideIndex + 1);
        } else {
          // At boundary, snap back
          this.setSlide(this.slideIndex);
        }
      } else {
        // Not enough movement, snap back to current slide
        this.setSlide(this.slideIndex);
      }
    }
    
    // Reset horizontal swipe flag
    this.isHorizontalSwipe = false;
  }

  mouseUp(event) {
    this.isDragging = false;
    this.container.style.cursor = 'grab';
    
    // Remove event listeners
    document.removeEventListener('mousemove', this.mouseMove.bind(this));
    document.removeEventListener('mouseup', this.mouseUp.bind(this));
    
    const movedBy = this.currentTranslate - this.prevTranslate;
    const containerWidth = this.container.offsetWidth;
    const threshold = containerWidth * 0.15; // 15% threshold for slide change (more sensitive)
    
    if (Math.abs(movedBy) > threshold) {
      if (movedBy > 0 && this.slideIndex > 0) {
        // Swipe right - go to previous slide
        this.setSlide(this.slideIndex - 1);
      } else if (movedBy < 0 && this.slideIndex < this.slides.length - 1) {
        // Swipe left - go to next slide
        this.setSlide(this.slideIndex + 1);
      } else {
        // At boundary, snap back
        this.setSlide(this.slideIndex);
      }
    } else {
      // Not enough movement, snap back to current slide
      this.setSlide(this.slideIndex);
    }
  }



  animation() {
    this.setSliderPosition(this.currentTranslate);
    if (this.isDragging) {
      requestAnimationFrame(this.animation.bind(this));
    }
  }

  setSliderPosition(translateX) {
    this.slidesContainer.style.transform = `translateX(${translateX}px)`;
  }
}

// --- Initialize Carousels using external config if available ---
document.addEventListener('DOMContentLoaded', () => {
  const cfg = window.CAROUSEL_CONFIG || {};
  const heroSlides = cfg.heroSlides || [];
  const recentWorkSlides = cfg.recentWorkSlides || [];

  if (document.getElementById('hero') && heroSlides.length) {
    new Carousel("hero", heroSlides, ["bg-red", "bg-blue", "bg-emerald", "bg-yellow"]);
  }
  if (document.getElementById('retail-carousel') && recentWorkSlides.length) {
    new Carousel("retail-carousel", recentWorkSlides, ["bg-red", "bg-blue", "bg-emerald", "bg-yellow"]);
  }
});

// Footer year
document.getElementById("copyright-year").textContent =
  new Date().getFullYear();

// --- Portfolio-specific functionality ---
(function initPortfolio() {
  // 1) Check that carousels have dots
  console.assert(
    document.querySelectorAll(".dots").length >= 2,
    "Hero and recent work carousel should have dots"
  );
  
  // 2) Hero is left-aligned (not centered) and 80% width on md+
  const mq = window.matchMedia("(min-width: 768px)");
  if (mq.matches) {
    const hero = document.getElementById("hero");
    const w = hero.getBoundingClientRect().width;
    const vw = window.innerWidth;
    console.assert(
      Math.abs(w - vw * 0.8) < vw * 0.02,
      "Hero should be ~80% width on >=768px"
    );
  }
  
  // 3) Cards have square corners
  const anyRounded = [...document.querySelectorAll(".card")].some(
    (el) => getComputedStyle(el).borderRadius !== "0px"
  );
  console.assert(!anyRounded, "Cards must not have border radius");
})();
