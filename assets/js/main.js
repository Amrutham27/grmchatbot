/*--------------------------
    Project Name: Allianz
    Version: 1.0
    Author: 7oorof
    Developer: Ahmed Abdallah (a.abdallah999@gmail.com)
    Release Date: April 2025
---------------------------*/

/*---------------------------
      Table of Contents
    --------------------
    01- Pre Loading
    02- Mobile Menu
    03- Sticky Navbar
    04- Scroll Top Button
    05- Set Background-img to section 
    06- Add active class to accordions
    07- Open and Close Popup
    08- Increase and Decrease Input Value
    09- Progress bars Aniamtion
    10- Sticky Cards
    11- Form Validations
    12- Popup Image and Video
    13- Range Slider
    14- Cards Shuffle sorting 
    15- counterUp  
    16- Swiper Slider 
    17- Nice Select
    18- Video Background

 ----------------------------*/

document.addEventListener("DOMContentLoaded", () => {

    // 01- Pre Loading
    setTimeout(() => document.querySelector(".preloader")?.remove(), 1000);

    // 02- Mobile Menu
    const navbarToggler = document.querySelector(".navbar-toggler");
    const navbarCollapse = document.querySelector(".navbar-collapse");
    const closeMobileMenu = document.querySelector(".close-mobile-menu");

    navbarToggler?.addEventListener("click", () => navbarCollapse?.classList.add("menu-opened"));
    closeMobileMenu?.addEventListener("click", () => navbarCollapse?.classList.remove("menu-opened"));

    // 03- Sticky Navbar
    window.addEventListener("scroll", () => {
        if (window.innerWidth >= 992) {
            document.querySelector(".sticky-navbar")?.classList.toggle("is-sticky", window.scrollY > 150);
        }
    });

    // 04- Scroll Top Button
    const scrollTopBtn = document.getElementById("scrollTopBtn");
    window.addEventListener("scroll", () => scrollTopBtn?.classList.toggle("active", window.scrollY > 700));
    scrollTopBtn?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

    // 05- Set Background-img to section 
    document.querySelectorAll('.bg-img')?.forEach(el => {
        const img = el.querySelector('img');
        if (img) {
            const parent = el.parentElement;
            if (parent) {
                parent.style.backgroundImage = `url(${img.src})`;
                parent.style.backgroundSize = 'cover';
                parent.style.backgroundPosition = 'center';
                parent.classList.add('bg-img');
                if (el.classList.contains('background-size-auto')) {
                    parent.classList.add('background-size-auto');
                }
            }
            el.remove();
        }
    });

    // 06- Add active class to accordions
    document.querySelectorAll(".accordion-header")?.forEach(header => {
        header.addEventListener("click", () => {
            const parent = header.parentElement;
            parent.classList.toggle("opened");
            parent.parentElement.querySelectorAll(".accordion-item").forEach(sibling => {
                if (sibling !== parent) sibling.classList.remove("opened");
            });
        });
    });

    // 07- Open and Close Popup
    const openPopup = (triggerSelector, popupSelector, addedClass) => {
        document.querySelector(triggerSelector)?.addEventListener("click", e => {
            e.preventDefault();
            document.querySelector(popupSelector)?.classList.toggle(addedClass);
        });
    };

    const closePopupFromOutside = (popupSelector, triggerSelector, removedClass) => {
        document.addEventListener("mouseup", e => {
            const popup = document.querySelector(popupSelector);
            const trigger = document.querySelector(triggerSelector);
            if (popup && trigger && !popup.contains(e.target) && !trigger.contains(e.target)) {
                popup.classList.remove(removedClass);
            }
        });
    };

    openPopup(".action-btn-cart", ".cart-minipopup", "active");
    closePopupFromOutside(".cart-minipopup", ".action-btn-cart", "active");

    // 08- Increase and Decrease Input Value
    document.querySelectorAll(".increase-qty").forEach(btn => {
        btn.addEventListener("click", () => {
            const qtyInput = btn.parentElement.querySelector(".qty-input");
            qtyInput.value = parseInt(qtyInput.value) + 1;
        });
    });

    document.querySelectorAll(".decrease-qty").forEach(btn => {
        btn.addEventListener("click", () => {
            const qtyInput = btn.parentElement.querySelector(".qty-input");
            const value = parseInt(qtyInput.value);
            if (value > 1) qtyInput.value = value - 1;
        });
    });

});

// 09- Progress bars Aniamtion
const progressBarsSection = document.querySelector(".animated-progressbars");
if (progressBarsSection) {
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateProgressBars(progressBarsSection);
                observer.unobserve(progressBarsSection); // Stops observing after first trigger
            }
        });
    }, { threshold: 0.8 });

    observer.observe(progressBarsSection);
}

function animateProgressBars(section) {
    section.querySelectorAll(".progress-bar").forEach(bar => {
        const value = bar.getAttribute("aria-valuenow") + "%";
        const percentage = bar.querySelector(".progress-percentage");
        const isVertical = section.classList.contains("progressbars-vertical");

        isVertical ? bar.style.height = value : bar.style.width = value;
        setTimeout(() => { if (percentage) percentage.textContent = value; }, isVertical ? 1000 : 500);
    });
}

// Progress Circles
const progressCircles = document.querySelectorAll(".progress-circle");
progressCircles?.forEach(circle => {
    const percentage = circle.getAttribute("data-percentage");
    const progressCirclePath = circle.querySelector(".progress");
    const textElement = circle.querySelector("text");
    const circumference = 283;
    const offset = circumference - (percentage / 100) * circumference;

    progressCirclePath.style.strokeDashoffset = offset;
    textElement.textContent = `${percentage}%`;
});

// 10- Sticky Cards
const stickyElements = document.querySelectorAll('.sticky-is-enabled > .sticky-top');
stickyElements?.forEach(element => {
    const observer = new IntersectionObserver(([entry]) => {
        element.classList.toggle('sticky-card-active', entry.intersectionRatio === 1);
    }, { threshold: [1] });

    observer.observe(element);
});

// 11- Form Validations
const contactForm = document.getElementById("contactForm");
if (contactForm) {
    const contactResult = document.querySelector(".contact-result");
    const validator = new JustValidate("#contactForm");

    document.querySelectorAll("#contactForm [required]").forEach(field => {
        validator.addField(`[name='${field.name}']`, [{
            rule: "required",
            errorMessage: "This field is required"
        }]);
    });

    validator.onSuccess(event => {
        event.preventDefault();
        contactResult.innerHTML = "Please Wait...";

        fetch("assets/php/contact.php", {
            method: "POST",
            body: new FormData(contactForm),
        })
            .then(response => response.text())
            .then(() => {
                contactResult.innerHTML = '<div class="alert alert-success" role="alert"><strong>Thank you. We will contact you shortly.</strong></div>';
                setTimeout(() => contactResult.style.display = "none", 5000);
            })
            .catch(() => {
                contactResult.innerHTML = '<div class="alert alert-danger" role="alert"><strong>Something went wrong. Please try again.</strong></div>';
            });
    });
}

// 12- Popup image and Video  
GLightbox({
    plyr: {
        config: {
            ratio: '16:9',
            muted: false,
            hideControls: false,
            youtube: {
                noCookie: true,
                rel: 0,
                showinfo: 0,
                iv_load_policy: 3
            },
            vimeo: {
                byline: false,
                portrait: false,
                title: false,
                speed: true,
                transparent: false
            }
        }
    }
});

// 13- Range Slider  
const rangeSlider = document.querySelector("rangeSlider");
const rangeSliderResult = document.querySelector("rangeSliderResult");
if (rangeSlider && rangeSliderResult) {
    noUiSlider.create(rangeSlider, {
        start: [50, 200], // Initial values
        connect: true,
        range: {
            min: 0,
            max: 300
        },
        tooltips: false, // Optional: Shows values above handles
        format: {
            to: function (value) {
                return "$" + value.toFixed(0);
            },
            from: function (value) {
                return Number(value.replace("$", ""));
            }
        }
    });

    // Update the input field when slider changes
    rangeSlider.noUiSlider.on("update", function (values) {
        rangeSliderResult.value = values[0] + " - " + values[1];
    });
}

// 14- Cards Shuffle sorting 
let filterdList = document.querySelector('#filtered-items-wrap');
if (filterdList) mixitup(filterdList);

// 15- counterUp   
const counterUp = window.counterUp.default;

const countersCallback = entries => {
    entries.forEach(entry => {
        const el = entry.target;
        if (entry.isIntersecting) {
            counterUp(el, {
                duration: 3000,
                delay: 16,
            });
            IO.unobserve(el); // Stop observing once triggered
        }
    });
};

const IO = new IntersectionObserver(countersCallback, { threshold: 1 });
document.querySelectorAll('.counter-number').forEach(el => IO.observe(el));

// 16- Swiper Slider  
let sliderDefaults = {
    spaceBetween: 5,
    slidesPerView: 1,
};
// call init function
initSwipers(sliderDefaults);

function initSwipers(defaults = {}, selector = ".swiper") {
    let swipers = document.querySelectorAll(selector);
    swipers.forEach((swiper) => {
        // get options
        let optionsData = swiper.dataset.swiper ? JSON.parse(swiper.dataset.swiper) : {};
        // combine defaults and custom options
        let options = { ...defaults, ...optionsData };
        // init
        new Swiper(swiper, options);
    });
}

let sliderThumbs = new Swiper(".slider-thumbs", {
    loop: true,
    spaceBetween: 0,
    slidesPerView: 4,
    watchSlidesProgress: true,
});

new Swiper(".slider-with-thumbs", {
    loop: true,
    spaceBetween: 0,
    navigation: {
        nextEl: "#swiper-thumb-next",
        prevEl: "#swiper-thumb-prev",
    },
    thumbs: {
        swiper: sliderThumbs,
    },
});

let verticalSliderThumbs = new Swiper(".slider-vertical-thumbs", {
    direction: "vertical",
    slidesPerView: 1,
    slidesPerGroup: 1,
    spaceBetween: 0,
    watchSlidesProgress: true,
    autoHeight: true,
    effect: "fade",
});
new Swiper(".slider-vertical", {
    direction: "vertical",
    slidesPerView: 3,
    slidesPerGroup: 1,
    spaceBetween: 60,
    speed: 1200,
    mousewheel: true,
    loop: true,
    watchSlidesProgress: true,
    autoplay: {
        delay: 5000,
    },
    thumbs: {
        swiper: verticalSliderThumbs,
    },
    breakpoints: {
        1200: {
            slidesPerView: 2,
            slidesPerGroup: 1
        }
    }
});

// 17- NiceSelect 
const selectElements = document.querySelectorAll("select");
if (selectElements.length > 0) {
    selectElements.forEach(select => NiceSelect.bind(select));
}

// 18- Video Background   
new VideoBackgrounds('[data-vbg]'); 