(() => {
    let projectName = document.getElementsByTagName("h1")[0];

    const log = (msg) => console.log("%cLOQUI%c " + msg, "background-color: #6da2a8; border-radius: 2px; padding: 3px;", "");

    if (projectName != undefined) {
        projectName = projectName.innerText;
        log("Found curseforge project. Name: " + projectName);

        const actions = document.getElementById("resource-options").getElementsByClassName("content-actions")[0];

        console.warn(actions);

        actions.innerHTML = `
            <li>
                <a class="branded-download" style="background-color:rgb(79, 146, 103);" onclick="alert('Search on Loqui here');">
                <img src="chrome-extension://${chrome.runtime.id}/icon.png" style="max-height: 100%; max-width: min-content;">
                <span>Translate with Loqui</span>
                </a>
            </li>
        ` + actions.innerHTML;

        log("Injected Loqui button");
    }
})();