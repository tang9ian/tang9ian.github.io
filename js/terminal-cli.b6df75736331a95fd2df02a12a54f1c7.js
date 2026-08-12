/**
 * Terminal CLI — interactive command input, boot sequence, keyboard shortcuts
 */
(function () {
  "use strict";

  var reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  var commandHistory = [];
  var historyIndex = -1;

  function getLangPrefix() {
    return window.location.pathname.startsWith("/zh-cn") ? "/zh-cn" : "";
  }

  function nav(path) {
    window.location.href = getLangPrefix() + path;
  }

  // === Command Processor ===
  function processCommand(input) {
    var cmd = input.trim();
    var cmdLower = cmd.toLowerCase();
    if (!cmd) return null;

    commandHistory.push(cmd);
    historyIndex = commandHistory.length;

    var parts = cmdLower.split(/\s+/);
    var command = parts[0];
    var args = parts.slice(1).join(" ");

    switch (command) {
      case "help":
        return [
          "Available commands:",
          "",
          "  ls                List blog posts",
          "  cd <page>         Navigate to page (home|posts|about|projects|contact)",
          "  cat <post-slug>   Open a blog post",
          "  pwd               Print current path",
          "  whoami            Display author info",
          "  theme [dark|light] Toggle or set theme",
          "  history           Show command history",
          "  clear             Go to homepage",
          "  date              Show current date/time",
          "  uptime            Session uptime",
          "  uname             System info",
          "  help              Show this message",
          "",
          "Shortcuts: Ctrl+K focus input | Up/Down history | Tab autocomplete",
        ].join("\n");

      case "ls":
        nav("/posts/");
        return "Listing posts...";

      case "cd":
        if (!args || args === "~" || args === "home" || args === "/") {
          nav("/");
          return null;
        }
        var pages = {
          posts: "/posts/",
          about: "/about/",
          projects: "/projects/",
          contact: "/contact/",
        };
        var target = args.replace(/^\/|\/$/g, "");
        if (pages[target]) {
          nav(pages[target]);
          return null;
        }
        return "cd: no such directory: " + args;

      case "cat":
        if (!args) return "cat: missing file operand";
        var slug = args.replace(/\.md$/, "").replace(/\s+/g, "-").toLowerCase();
        nav("/posts/" + slug + "/");
        return null;

      case "pwd":
        return window.location.pathname;

      case "whoami":
        return "Charles Tang\nFull-stack Developer\nBackend: ColdFusion, Java, Golang\nFrontend: Node.js, React, Vue.js, Svelte";

      case "theme":
        if (typeof toggleTheme !== "function") return "theme: not available";
        if (args === "dark" || args === "light") {
          flickerAndToggle(args);
          return "Theme set to " + args + ".";
        }
        flickerAndToggle();
        return "Theme toggled.";

      case "history":
        if (commandHistory.length <= 1) return "(no history)";
        return commandHistory
          .slice(0, -1)
          .map(function (c, i) {
            return "  " + (i + 1) + "  " + c;
          })
          .join("\n");

      case "clear":
        nav("/");
        return null;

      case "date":
        return new Date().toString();

      case "uptime":
        var up = Math.floor(performance.now() / 1000);
        var m = Math.floor(up / 60);
        var s = up % 60;
        return "up " + m + " min " + s + " sec";

      case "uname":
        return "PortfolioOS 1.0.0 (tang9ian.github.io) Hugo/0.159.0 JetBrains-Mono/14px";

      case "echo":
        return input.trim().substring(5) || "";

      case "sudo":
        return "[sudo] password for charles: \nPermission denied.";

      case "rm":
        return "rm: operation not permitted on portfolio";

      case "vim":
      case "nano":
      case "emacs":
        return command + ": editor not available. Read-only terminal.";

      case "man":
        return args
          ? 'No manual entry for "' + args + '". Try "help".'
          : 'What manual page? Try "help".';

      case "ping":
        return args
          ? "PING " +
              args +
              ": 64 bytes, time=0.042ms\n--- " +
              args +
              " ping statistics ---\n1 packets transmitted, 1 received, 0% packet loss"
          : "ping: missing host operand";

      case "exit":
        return "exit: Cannot close browser tab. Use Ctrl+W.";

      default:
        return cmd + ": command not found. Type 'help' for available commands.";
    }
  }

  // === Theme toggle with screen flicker ===
  function flickerAndToggle(theme) {
    if (!reducedMotion) {
      var win = document.querySelector(".terminal-window");
      if (win) {
        win.classList.add("flickering");
        setTimeout(function () {
          win.classList.remove("flickering");
        }, 250);
      }
    }
    if (typeof theme === "string") {
      document.body.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
      var icon = document.getElementById("theme-icon");
      if (icon)
        icon.textContent = theme === "light" ? "\u2600\uFE0F" : "\uD83C\uDF19";
    } else if (typeof toggleTheme === "function") {
      toggleTheme();
    }
  }

  // === Boot Sequence ===
  function runBoot(callback) {
    var screen = document.getElementById("boot-screen");
    var log = document.getElementById("boot-log");

    if (!screen || !log || screen.classList.contains("hidden")) {
      if (callback) callback();
      return;
    }

    var lines = [
      "[    0.000] BIOS-provided physical RAM map:",
      "[    0.004] kernel: Linux 6.8.0-portfolio x86_64",
      "[    0.012] CPU: JetBrains Mono @ 14px (1 core)",
      "[    0.025] Memory: 1024MB available",
      "[    0.038] Loading portfolio modules...",
      '[    0.089] <span class="boot-ok">[  OK  ]</span> Mounted /home/charles',
      '[    0.124] <span class="boot-ok">[  OK  ]</span> Started hugo-server.service',
      '[    0.156] <span class="boot-ok">[  OK  ]</span> Network: tang9ian.github.io',
      '[    0.189] <span class="boot-ok">[  OK  ]</span> Theme: terminal-style loaded',
      "[    0.212] System ready.",
      "",
      "charles@portfolio:~$ startx",
    ];

    var totalDelay = 0;
    var delays = [0, 50, 60, 50, 100, 80, 70, 80, 70, 120, 80, 250];

    lines.forEach(function (line, i) {
      totalDelay += delays[i] || 60;
      setTimeout(function () {
        log.innerHTML += line + "\n";
      }, totalDelay);
    });

    setTimeout(function () {
      screen.style.transition = "opacity 0.4s ease";
      screen.style.opacity = "0";
      setTimeout(function () {
        screen.classList.add("hidden");
        sessionStorage.setItem("booted", "true");
        if (callback) callback();
      }, 400);
    }, totalDelay + 200);
  }

  // === Command Input ===
  function initInput() {
    var input = document.getElementById("cmd-input");
    var output = document.getElementById("cmd-output");
    if (!input || !output) return;

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        var result = processCommand(input.value);
        if (result !== null) {
          output.textContent = result;
          output.classList.add("visible");
          clearTimeout(output._hideTimer);
          output._hideTimer = setTimeout(function () {
            output.classList.remove("visible");
          }, 10000);
        }
        input.value = "";
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (historyIndex > 0) {
          historyIndex--;
          input.value = commandHistory[historyIndex];
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
          historyIndex++;
          input.value = commandHistory[historyIndex];
        } else {
          historyIndex = commandHistory.length;
          input.value = "";
        }
      } else if (e.key === "Escape") {
        input.value = "";
        output.classList.remove("visible");
        input.blur();
      } else if (e.key === "Tab") {
        e.preventDefault();
        var val = input.value.trim().toLowerCase();
        if (!val) return;
        var completions = [
          "help",
          "ls",
          "cd posts",
          "cd about",
          "cd projects",
          "cd contact",
          "cd home",
          "cat ",
          "pwd",
          "whoami",
          "theme",
          "theme dark",
          "theme light",
          "history",
          "clear",
          "date",
          "uptime",
          "uname",
        ];
        for (var c = 0; c < completions.length; c++) {
          if (completions[c].indexOf(val) === 0 && completions[c] !== val) {
            input.value = completions[c];
            break;
          }
        }
      }
    });
  }

  // === Keyboard Shortcuts ===
  function initShortcuts() {
    document.addEventListener("keydown", function (e) {
      // Ctrl+K or Cmd+K to focus command input
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        var input = document.getElementById("cmd-input");
        if (input) {
          input.focus();
          input.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }
    });
  }

  // === Theme toggle flicker enhancement ===
  function enhanceThemeToggle() {
    var btn = document.querySelector(".floating-theme-toggle");
    if (!btn || reducedMotion) return;

    btn.removeAttribute("onclick");
    btn.addEventListener("click", function () {
      flickerAndToggle();
    });
  }

  // === Scroll line number in status bar ===
  function initLineTracker() {
    var el = document.getElementById("status-line");
    if (!el) return;

    var ticking = false;
    function update() {
      var scrollTop = window.pageYOffset;
      var lineHeight = 20;
      var line = Math.max(1, Math.floor(scrollTop / lineHeight) + 1);
      el.textContent = "ln " + line;
    }
    update();

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          requestAnimationFrame(function () {
            update();
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true },
    );
  }

  // === Init ===
  document.addEventListener("DOMContentLoaded", function () {
    runBoot(function () {
      initInput();
      initShortcuts();
      enhanceThemeToggle();
      initLineTracker();
    });
  });
})();
