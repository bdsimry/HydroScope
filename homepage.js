document.addEventListener("DOMContentLoaded", () => {
    const counters = document.querySelectorAll(".count");
    
    // Define durations
    const duration38 = 2000; // Duration for "38%" counter (in milliseconds)
    const duration17 = 2000; // Duration for "17%" counter
    const delay17 = 1000; // Delay "17%" to start after "38%" finishes

    // Function to animate the count
    const animateCount = (counter, duration) => {
        const target = +counter.getAttribute("data-target");
        const increment = target / (duration / 10);

        const updateCounter = () => {
            const count = +counter.innerText;
            if (count < target) {
                counter.innerText = Math.ceil(count + increment);
                setTimeout(updateCounter, 30);
            } else {
                counter.innerText = target;
            }
        };

        updateCounter(); // Start the counter immediately
    };

    // Start "38%" counter immediately
    animateCount(counters[0], duration38);

    // Start "17%" counter after the delay
    setTimeout(() => {
        animateCount(counters[1], duration17);
    }, delay17);
});

document.addEventListener("DOMContentLoaded", () => {
    const sections = document.querySelectorAll('.animate-on-scroll');

    // Intersection Observer for detecting when sections come into view
    const observerOptions = {
        root: null, // use the viewport
        rootMargin: "0px", // no margin
        threshold: 0.5 // trigger when 50% of the element is visible
    };

    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-normal'); // Add the fade-in animation
                observer.unobserve(entry.target); // Stop observing after animation
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sections.forEach(section => {
        observer.observe(section); // Start observing each section
    });
});
