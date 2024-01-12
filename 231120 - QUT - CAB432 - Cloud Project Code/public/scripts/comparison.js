document.addEventListener("DOMContentLoaded", () => {
    const slider = document.querySelector(".slider input");
    const img = document.querySelector(".images .img-2");
    const dragLine = document.querySelector(".slider .drag-line");
  
    slider.addEventListener("input", () => {
      let sliderVal = slider.value;
      dragLine.style.left = sliderVal + "%";
      img.style.width = sliderVal + "%";
    });
  });
  