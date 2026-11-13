const projectTree = document.querySelector(".project-tree");
const projectSideNav = document.querySelector(".yaj-project-side-nav");
const projectToggle = document.querySelector(".project-side-nav__toggle");
const projectClose = document.querySelector(".project-side-nav__close");
const openFullButton = document.querySelector(".open_full");
const refreshButton = document.querySelector(".refresh-preview");
const openFullIcon = openFullButton.querySelector(".material-symbols-outlined");
const tabBar = document.querySelector(".yaj-tab-bar");
const codeViewer = document.querySelector(".code-viewer");
const editorBreadcrumb = document.querySelector("#editor-breadcrumb");
const editorMessage = document.querySelector("#editor-message");
const editorCode = document.querySelector("#editor-code");
const editorGutter = document.querySelector("#editor-gutter");
const sourceCode = document.querySelector("#source-code");
const htmlPreview = document.querySelector("#html-preview");
const markdownPreview = document.querySelector("#markdown-preview");
const openTabs = [];
let activeTab = null;

// for opening proj side nav
function setProjectNavOpen(isOpen) {
    projectSideNav.classList.toggle("is-closed", !isOpen);
    document.body.classList.toggle("project-nav-collapsed", !isOpen);
    projectToggle.setAttribute("aria-expanded", String(isOpen));
}

projectToggle.addEventListener("click", () => {
    setProjectNavOpen(projectToggle.getAttribute("aria-expanded") !== "true");
});

projectClose.addEventListener("click", () => {
    setProjectNavOpen(false);
    projectToggle.focus();
});

function setFullView(isOpen) {
    document.body.classList.toggle("is-full-view", isOpen);
    const label = isOpen ? "Exit full view" : "Enter full view";
    openFullIcon.textContent = isOpen ? "close_fullscreen" : "open_in_full";
    openFullButton.setAttribute("aria-label", label);
    openFullButton.setAttribute("aria-pressed", String(isOpen));
    openFullButton.title = label;
}

openFullButton.addEventListener("click", () => {
    setFullView(!document.body.classList.contains("is-full-view"));
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setFullView(false);
});

function renderTabs() {
    tabBar.replaceChildren();

    openTabs.forEach((fileTab) => {
        const tab = document.createElement("div");
        tab.className = "editor-tab";
        tab.classList.toggle("is-active", fileTab === activeTab);
        tab.setAttribute("role", "presentation");

        const selectButton = document.createElement("button");
        selectButton.className = "editor-tab__select";
        selectButton.type = "button";
        selectButton.setAttribute("role", "tab");
        selectButton.setAttribute("aria-selected", String(fileTab === activeTab));
        selectButton.setAttribute("title", fileTab.path);
        if (fileTab.icon) {
            const favicon = document.createElement("img");
            favicon.className = "editor-tab__favicon";
            favicon.src = fileTab.icon;
            favicon.alt = "";
            selectButton.append(favicon);
        } else if (fileTab.mode !== "preview") {
            const icon = document.createElement("span");
            icon.className = "editor-tab__icon material-symbols-outlined";
            icon.setAttribute("aria-hidden", "true");
            icon.textContent = fileTab.mode === "preview" ? "web" : getFileIcon(fileTab.name);
            selectButton.append(icon);
        }

        const label = document.createElement("span");
        label.className = "editor-tab__label";
        label.textContent = fileTab.name;
        selectButton.append(label);
        selectButton.addEventListener("click", () => {
            activeTab = fileTab;
            renderTabs();
            renderEditor();
        });

        const closeButton = document.createElement("button");
        closeButton.className = "editor-tab__close";
        closeButton.type = "button";
        closeButton.setAttribute("aria-label", `Close ${fileTab.name}`);
        closeButton.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">close</span>';
        closeButton.addEventListener("click", () => {
            const closedIndex = openTabs.indexOf(fileTab);
            openTabs.splice(closedIndex, 1);
            if (activeTab === fileTab) {
                activeTab = openTabs[Math.min(closedIndex, openTabs.length - 1)] || null;
            }
            renderTabs();
            renderEditor();
        });

        tab.append(selectButton, closeButton);
        tabBar.append(tab);
    });
}

function renderEditor() {
    refreshButton.disabled = !activeTab;
    if (!activeTab) {
        htmlPreview.hidden = true;
        markdownPreview.hidden = true;
        editorBreadcrumb.textContent = "No file open";
        editorMessage.textContent = "Select a file from the project tree";
        editorMessage.hidden = false;
        editorCode.hidden = true;
        return;
    }

    editorBreadcrumb.textContent = activeTab.path || activeTab.name;
    if (activeTab.mode === "preview") {
        editorMessage.hidden = true;
        editorCode.hidden = true;
        markdownPreview.hidden = true;
        htmlPreview.hidden = false;
        htmlPreview.title = `Rendered preview of ${activeTab.name}`;
        if (htmlPreview.dataset.source !== activeTab.path) {
            htmlPreview.src = activeTab.path;
            htmlPreview.dataset.source = activeTab.path;
        }
        return;
    }

    htmlPreview.hidden = true;
    markdownPreview.hidden = true;
    if (activeTab.loading || activeTab.content === null || activeTab.error || activeTab.content === "") {
        editorMessage.textContent = activeTab.loading
            ? "Loading source..."
            : activeTab.error || (activeTab.content === null ? "Loading source..." : "Empty file");
        editorMessage.hidden = false;
        editorCode.hidden = true;
        return;
    }

    if (activeTab.mode === "markdown") {
        editorMessage.hidden = true;
        editorCode.hidden = true;
        markdownPreview.hidden = false;
        if (activeTab.renderedMarkdown) {
            markdownPreview.innerHTML = activeTab.renderedMarkdown;
        } else {
            const rawMarkdown = document.createElement("pre");
            rawMarkdown.textContent = activeTab.content;
            markdownPreview.replaceChildren(rawMarkdown);
        }
        return;
    }

    editorMessage.hidden = true;
    editorCode.hidden = false;
    const extension = activeTab.name.split(".").pop().toLowerCase();
    const language = { html: "xml", css: "css", js: "javascript", md: "markdown" }[extension];
    if (activeTab.highlighted) sourceCode.innerHTML = activeTab.highlighted;
    else sourceCode.textContent = activeTab.content;
    editorGutter.textContent = activeTab.lineNumbers;
}

function getFileIcon(fileName) {
    const extension = fileName.split(".").pop().toLowerCase();
    return { html: "html", css: "css", js: "javascript", md: "markdown" }[extension] || "description";
}

async function loadPreviewMetadata(fileTab) {
    fileTab.metadataLoading = true;
    try {
        const response = await fetch(fileTab.path);
        if (!response.ok) throw new Error("Unable to read preview metadata.");
        const source = await response.text();
        const previewDocument = new DOMParser().parseFromString(source, "text/html");
        fileTab.name = previewDocument.title.trim() || fileTab.defaultName;
        const iconHref = previewDocument.querySelector('link[rel~="icon"]')?.getAttribute("href");
        fileTab.icon = iconHref ? new URL(iconHref, new URL(fileTab.path, document.baseURI)).href : "";
    } catch {
        fileTab.name = fileTab.defaultName;
        fileTab.icon = "";
    } finally {
        fileTab.metadataLoading = false;
        fileTab.metadataLoaded = true;
        if (openTabs.includes(fileTab)) renderTabs();
    }
}

async function loadSource(fileTab) {
    fileTab.loading = true;
    fileTab.error = "";
    if (activeTab === fileTab) renderEditor();
    try {
        const response = await fetch(fileTab.path);
        if (!response.ok) throw new Error(`Unable to load source (${response.status}).`);
        fileTab.content = await response.text();
        const language = { html: "xml", css: "css", js: "javascript", md: "markdown" }[fileTab.name.split(".").pop().toLowerCase()];
        if (window.hljs && language) fileTab.highlighted = window.hljs.highlight(fileTab.content, { language }).value;
        if (fileTab.mode === "markdown" && window.marked && window.DOMPurify) {
            fileTab.renderedMarkdown = window.DOMPurify.sanitize(window.marked.parse(fileTab.content));
        }
        fileTab.lineNumbers = Array.from({ length: fileTab.content.split(/\r\n|\r|\n/).length }, (_, index) => index + 1).join("\n");
    } catch (error) {
        fileTab.error = error.message;
    } finally {
        fileTab.loading = false;
        if (activeTab === fileTab) renderEditor();
    }
}

function refreshActiveTab() {
    if (!activeTab) return;
    if (activeTab.mode === "preview") {
        htmlPreview.src = `${activeTab.path}?refresh=${Date.now()}`;
        htmlPreview.dataset.source = activeTab.path;
        activeTab.metadataLoaded = false;
        loadPreviewMetadata(activeTab);
        return;
    }

    activeTab.content = null;
    activeTab.highlighted = "";
    activeTab.lineNumbers = "";
    loadSource(activeTab);
}

refreshButton.addEventListener("click", refreshActiveTab);

async function openFileTab(fileButton, previewPath = "", modeOverride = "") {
    const fileName = fileButton.lastElementChild.textContent.trim();
    const filePath = previewPath || fileButton.querySelector("[data-file-source]")?.dataset.fileSource || "";
    const mode = modeOverride || (previewPath ? "preview" : "source");
    let fileTab = openTabs.find((tab) => tab.path === filePath && tab.mode === mode && filePath);

    if (!fileTab) {
        fileTab = { name: fileName, defaultName: fileName, path: filePath, mode, icon: "", content: null, highlighted: "", renderedMarkdown: "", lineNumbers: "", loading: false, error: "", metadataLoaded: false, metadataLoading: false };
        openTabs.push(fileTab);
    }

    activeTab = fileTab;
    renderTabs();
    renderEditor();

    if (mode === "preview") {
        if (!fileTab.metadataLoaded && !fileTab.metadataLoading) loadPreviewMetadata(fileTab);
        return;
    }

    if (fileTab.content !== null || fileTab.loading || fileTab.error) return;
    if (!filePath) {
        fileTab.error = "No source file is mapped to this item.";
        renderEditor();
        return;
    }

    loadSource(fileTab);
}


// for clicking the sutff idk
projectTree.addEventListener(
    "click", (event) => {
        const selectedItem = event.target.closest(
            "[data-project-item]"
        );

        if (!selectedItem || !projectTree.contains(selectedItem)) return;

        const childrenId = selectedItem.getAttribute("aria-controls");
        if (childrenId) {
            const children = document.getElementById(childrenId);
            const isExpanded = selectedItem.getAttribute("aria-expanded") === "true";
            selectedItem.setAttribute("aria-expanded", String(!isExpanded));
            children.hidden = isExpanded;
            selectedItem.querySelector("[data-tree-chevron]").textContent = isExpanded
                ? "keyboard_arrow_right"
                : "keyboard_arrow_down";
        }

        projectTree.querySelectorAll("[data-project-item]").forEach((item) => {
            item.setAttribute("aria-pressed", String(item === selectedItem));
        });

        const markdownPath = selectedItem.querySelector("[data-markdown-preview]")?.dataset.fileSource;
        const previewFiles = [...selectedItem.parentElement.querySelectorAll(
            ":scope > ul.project-children > li > button[data-project-item]"
        )].filter((button) => {
            const path = button.querySelector("[data-file-source]")?.dataset.fileSource;
            return path?.toLowerCase().endsWith(".html");
        });

        if (markdownPath) {
            openFileTab(selectedItem, markdownPath, "markdown");
        } else if (previewFiles.length) {
            const firstPath = previewFiles[0].querySelector("[data-file-source]").dataset.fileSource;
            previewFiles.forEach((button) => {
                const path = button.querySelector("[data-file-source]").dataset.fileSource;
                openFileTab(button, path);
            });
            activeTab = openTabs.find((tab) => tab.path === firstPath && tab.mode === "preview") || activeTab;
            renderTabs();
            renderEditor();
        } else if (!childrenId) {
            openFileTab(selectedItem);
        }
    }
)

async function startDesktop() {
    const aboutFile = projectTree.querySelector('[data-file-source="src/me/about_me.html"]');
    const projectsFile = projectTree.querySelector('[data-file-source="src/me/github_projects.html"]');
    const aboutButton = aboutFile?.closest("[data-project-item]");
    const projectsButton = projectsFile?.closest("[data-project-item]");
    if (!aboutButton || !projectsButton) {
        editorMessage.textContent = "Unable to open the About and Projects pages automatically. Select a file from the project tree.";
        document.body.classList.remove("is-starting");
        return;
    }

    ["src-children", "me-children"].forEach((childrenId) => {
        const toggle = projectTree.querySelector(`[aria-controls="${childrenId}"]`);
        const children = document.getElementById(childrenId);
        toggle.setAttribute("aria-expanded", "true");
        toggle.querySelector("[data-tree-chevron]").textContent = "keyboard_arrow_down";
        children.hidden = false;
    });
    projectTree.querySelectorAll("[data-project-item]").forEach((item) => {
        item.setAttribute("aria-pressed", String(item === aboutButton));
    });

    const previewReady = new Promise((resolve) => {
        let timeoutId;
        const finish = () => {
            window.clearTimeout(timeoutId);
            resolve();
        };
        htmlPreview.addEventListener("load", finish, { once: true });
        timeoutId = window.setTimeout(finish, 5000);
    });

    openFileTab(aboutButton, aboutFile.dataset.fileSource);
    openFileTab(projectsButton, projectsFile.dataset.fileSource);
    activeTab = openTabs.find((tab) => tab.path === aboutFile.dataset.fileSource && tab.mode === "preview");
    renderTabs();
    renderEditor();

    await Promise.all([
        previewReady,
        new Promise((resolve) => window.setTimeout(resolve, 1400))
    ]);
    document.body.classList.remove("is-starting");
}

startDesktop();
