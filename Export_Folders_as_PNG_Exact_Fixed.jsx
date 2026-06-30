#target photoshop

if (app.documents.length === 0) {

    alert("Open a PSD first.");

} else {

    var originalDoc = app.activeDocument;

    if (!originalDoc.saved) {
        alert("Please save the PSD first, so the script knows where to create the PNG Exports folder.");
    } else {

        var outputFolder = new Folder(originalDoc.path + "/PNG Exports");
        if (!outputFolder.exists) outputFolder.create();

        var pngOptions = new PNGSaveOptions();
        pngOptions.compression = 0;
        pngOptions.interlaced = false;

        function safeFileName(name) {
            // Keeps the folder name as close as possible, only replacing characters
            // that macOS/Windows cannot use in filenames.
            return name.replace(/[\/\\:\*\?"<>\|]/g, "_");
        }

        // Store the names of all top-level folders before exporting.
        var folderNames = [];
        for (var i = 0; i < originalDoc.layerSets.length; i++) {
            folderNames.push(originalDoc.layerSets[i].name);
        }

        for (var f = 0; f < folderNames.length; f++) {

            app.activeDocument = originalDoc;

            var targetName = folderNames[f];

            // Duplicate the whole PSD to preserve exact canvas size.
            var dup = originalDoc.duplicate();

            app.activeDocument = dup;

            // Delete every top-level layer/folder except the target folder.
            for (var j = dup.layers.length - 1; j >= 0; j--) {
                var layer = dup.layers[j];

                if (!(layer.typename === "LayerSet" && layer.name === targetName)) {
                    layer.remove();
                } else {
                    layer.visible = true;
                }
            }

            // Save with the folder name exactly.
            var saveFile = new File(outputFolder + "/" + safeFileName(targetName) + ".png");
            dup.saveAs(saveFile, pngOptions, true, Extension.LOWERCASE);

            dup.close(SaveOptions.DONOTSAVECHANGES);
        }

        app.activeDocument = originalDoc;

        alert("Done! Exported " + folderNames.length + " folders to 'PNG Exports'.");
    }
}
