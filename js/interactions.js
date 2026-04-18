/**
 * Terminal Interactive Elements
 * Scroll reveal, text scramble, typing effect, spotlight, ripple, scroll progress
 */
(function () {
  "use strict";

  var reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // === Text Scramble Decoder ===
  function scrambleText(element, finalText, duration) {
    var chars = "!<>-_\\/[]{}=+*^?#~0123456789abcdef";
    var steps = 14;
    var step = 0;
    var timer = setInterval(function () {
      step++;
      var progress = step / steps;
      element.textContent = finalText
        .split("")
        .map(function (c, i) {
          if (c === " ") return " ";
          if (i / finalText.length < progress) return c;
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join("");
      if (step >= steps) {
        clearInterval(timer);
        element.textContent = finalText;
      }
    }, duration / steps);
  }

  document.addEventListener("DOMContentLoaded", function () {
    // === Terminal Window Entrance Pulse ===
    if (!reducedMotion) {
      var win = document.querySelector(".terminal-window");
      if (win) {
        win.classList.add("entrance");
        win.addEventListener("animationend", function () {
          win.classList.remove("entrance");
        });
      }
    }

    // === Terminal Title Scramble ===
    if (!reducedMotion) {
      var title = document.querySelector(".terminal-title");
      if (title) {
        var titleText = title.textContent;
        title.textContent = "";
        setTimeout(function () {
          scrambleText(title, titleText, 700);
        }, 300);
      }
    }

    // === Scroll Reveal + Prompt Scramble ===
    var allTargets = document.querySelectorAll(
      ".command-output, .prompt.cursor",
    );
    // Skip reveal on tall article containers (single post pages)
    var revealTargets = [];
    allTargets.forEach(function (el) {
      if (el.querySelector && el.querySelector(".post")) {
        // Article container: show immediately, scramble its prompt on load
        el.classList.add("revealed");
        if (!reducedMotion) {
          var articlePrompt = el.querySelector(".prompt");
          if (articlePrompt) {
            articlePrompt._handled = true;
            var txt = articlePrompt.textContent;
            articlePrompt.textContent = "";
            setTimeout(function () {
              scrambleText(articlePrompt, txt, 500);
            }, 400);
          }
        }
      } else {
        revealTargets.push(el);
      }
    });

    if (allTargets.length) {
      // Store and clear prompt text for scramble decode effect
      var promptTexts = new Map();
      if (!reducedMotion) {
        document
          .querySelectorAll(".command-output .prompt")
          .forEach(function (p) {
            if (p._handled) return; // already handled by article scramble
            promptTexts.set(p, p.textContent);
            p.textContent = "";
          });
      }

      // Mark elements for reveal animation
      revealTargets.forEach(function (block) {
        block.classList.add("reveal-ready");
      });

      if (reducedMotion) {
        // Instantly reveal all
        revealTargets.forEach(function (b) {
          b.classList.add("revealed");
        });
      } else {
        var observer = new IntersectionObserver(
          function (entries) {
            var visible = entries.filter(function (e) {
              return e.isIntersecting;
            });
            visible.forEach(function (entry, i) {
              var target = entry.target;
              // Stagger reveals within each batch
              setTimeout(function () {
                target.classList.add("revealed");
                // Trigger text scramble for prompt inside
                var prompt = target.querySelector
                  ? target.querySelector(".prompt")
                  : null;
                if (prompt && promptTexts.has(prompt)) {
                  setTimeout(function () {
                    scrambleText(prompt, promptTexts.get(prompt), 500);
                  }, 100);
                }
              }, i * 80);
              observer.unobserve(target);
            });
          },
          { threshold: 0.1, rootMargin: "0px 0px -30px 0px" },
        );

        revealTargets.forEach(function (block) {
          observer.observe(block);
        });
      }
    }

    // === Typing Effect for "help" Cursor Prompt ===
    if (!reducedMotion) {
      var cursorEl = document.querySelector(".prompt.cursor");
      if (cursorEl) {
        var textNode = null;
        for (var i = 0; i < cursorEl.childNodes.length; i++) {
          if (
            cursorEl.childNodes[i].nodeType === 3 &&
            cursorEl.childNodes[i].textContent.trim()
          ) {
            textNode = cursorEl.childNodes[i];
            break;
          }
        }
        if (textNode) {
          var fullText = textNode.textContent;
          textNode.textContent = "";

          // Start typing after reveal transition completes
          cursorEl.addEventListener("transitionend", function handler(e) {
            if (e.propertyName !== "opacity") return;
            cursorEl.removeEventListener("transitionend", handler);
            var idx = 0;
            var typeTimer = setInterval(function () {
              textNode.textContent += fullText[idx];
              idx++;
              if (idx >= fullText.length) clearInterval(typeTimer);
            }, 100);
          });
        }
      }
    }

    // === Scroll Progress Bar ===
    if (!reducedMotion) {
      var bar = document.createElement("div");
      bar.className = "scroll-progress";
      bar.setAttribute("aria-hidden", "true");
      document.body.appendChild(bar);

      var ticking = false;
      window.addEventListener(
        "scroll",
        function () {
          if (!ticking) {
            requestAnimationFrame(function () {
              var top = window.pageYOffset;
              var height =
                document.documentElement.scrollHeight - window.innerHeight;
              bar.style.transform =
                "scaleX(" + (height > 0 ? Math.min(top / height, 1) : 0) + ")";
              ticking = false;
            });
            ticking = true;
          }
        },
        { passive: true },
      );
    }

    // === File Item Spotlight (cursor-tracking glow) ===
    document.querySelectorAll(".file-list").forEach(function (list) {
      list.addEventListener("mousemove", function (e) {
        list.querySelectorAll(".file-item").forEach(function (item) {
          var rect = item.getBoundingClientRect();
          item.style.setProperty("--spot-x", e.clientX - rect.left + "px");
          item.style.setProperty("--spot-y", e.clientY - rect.top + "px");
        });
      });
    });

    // === Button Ripple on Click ===
    if (!reducedMotion) {
      document.addEventListener("click", function (e) {
        var btn = e.target.closest(".button, .btn");
        if (!btn) return;
        var rect = btn.getBoundingClientRect();
        var ripple = document.createElement("span");
        ripple.className = "click-ripple";
        var size = Math.max(rect.width, rect.height) * 2;
        ripple.style.width = ripple.style.height = size + "px";
        ripple.style.left = e.clientX - rect.left - size / 2 + "px";
        ripple.style.top = e.clientY - rect.top - size / 2 + "px";
        btn.appendChild(ripple);
        ripple.addEventListener("animationend", function () {
          ripple.remove();
        });
      });
    }
  });
})();
