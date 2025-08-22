// --- Generic Carousel System ---
class Carousel {
  constructor(containerId, slides, backgroundClasses = []) {
    this.container = document.getElementById(containerId);
    this.slides = slides;
    this.backgroundClasses = backgroundClasses;
    this.slideIndex = 0;
    this.dotsContainer = document.getElementById(`${containerId}-dots`);

    this.init();
  }

  init() {
    this.createSlidingStructure();
    this.buildDots();
    this.setSlide(0);
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
      slideElement.className = `carousel-slide ${slide.bg}`;
      slideElement.href = slide.link || '#';
      
      // Create slide content structure
      slideElement.innerHTML = `
        <div class="pad">
          <div class="title carousel-title-${index}"></div>
        </div>
        <div class="caption carousel-caption-${index}"></div>
      `;
      
      // Update content
      const titleEl = slideElement.querySelector(`.carousel-title-${index}`);
      const captionEl = slideElement.querySelector(`.carousel-caption-${index}`);
      
      if (Array.isArray(slide.html)) {
        titleEl.innerHTML = slide.html
          .map((line) => `<span>${line}</span>`)
          .join("<br>");
      } else {
        titleEl.innerHTML = slide.html;
      }
      
      captionEl.textContent = slide.caption;
      
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
    
    // Slide to the correct position
    const translateX = -this.slideIndex * 100;
    this.slidesContainer.style.transform = `translateX(${translateX}%)`;

    // Update dots
    [...this.dotsContainer.children].forEach((dot, idx) =>
      dot.setAttribute(
        "aria-current",
        idx === this.slideIndex ? "true" : "false"
      )
    );
  }
}

// --- Portfolio Carousel Data ---
const heroSlides = [
  {
    bg: "bg-red",
    html: [
      "E-Commerce",
      "Mobile App",
      "Redesign",
      "2024",
    ],
    caption: "Project: ShopFlow Mobile",
    link: "https://google.com?q=ShopFlow+Mobile",
  },
  {
    bg: "bg-blue",
    html: ["Banking", "Dashboard", "Interface", "2024"],
    caption: "Project: SecureBank Pro",
    link: "https://google.com?q=SecureBank+Pro",
  },
  {
    bg: "bg-emerald",
    html: ["Healthcare", "Patient Portal", "UX Research", "2023"],
    caption: "Project: MedConnect",
    link: "https://google.com?q=MedConnect",
  },
  {
    bg: "bg-yellow",
    html: ["Travel Booking", "Web Platform", "Complete Redesign"],
    caption: "Project: WanderWise",
    link: "https://google.com?q=WanderWise",
  },
];

const recentWorkSlides = [
  {
    bg: "bg-blue",
    html: "Dashboard<br>Analytics",
    caption: "FinTech Platform",
    link: "https://google.com?q=FinTech+Platform",
  },
  {
    bg: "bg-red",
    html: "Mobile App<br>User Experience<br>Design",
    caption: "Fitness Tracker",
    link: "https://google.com?q=Fitness+Tracker",
  },
  {
    bg: "bg-emerald",
    html: "E-commerce<br>Checkout Flow<br>Optimization",
    caption: "RetailMax",
    link: "https://google.com?q=RetailMax",
  },
  {
    bg: "bg-yellow",
    html: "SaaS Platform<br>Design System<br>Implementation",
    caption: "ProductivityHub",
    link: "https://google.com?q=ProductivityHub",
  },
];

// --- Initialize Carousels ---
const heroCarousel = new Carousel("hero", heroSlides, [
  "bg-red",
  "bg-blue",
  "bg-emerald",
  "bg-yellow",
]);
const recentWorkCarousel = new Carousel("retail-carousel", recentWorkSlides, [
  "bg-red",
  "bg-blue",
  "bg-emerald",
  "bg-yellow",
]);

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
