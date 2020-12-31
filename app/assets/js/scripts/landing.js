var request = require('request');
var fs = require('fs');
var path = require("path");
var http = require("http");
const md5File = require('md5-file');
var exec = require('child_process').execFile;

var num_files = 1;
var itemsProcessed = 0;
var changes = 0;
var update_available = false;

document.getElementsByTagName('iframe')[0].src += '?' + new Date().getTime();

// BIND LAUNCH
document.getElementById('launchButton').onclick = (e) => {
    launch();
}

// Bind settings button
document.getElementById('settingsButton').onclick = (e) => {
    switchView(VIEWS.landing, VIEWS.settings)
}

function launch() {
    if(checkInstalled()) {


        //Check for updates

        if(update_available) {
            document.getElementById("launchButton").disabled = true;
            //document.getElementById('launchButton').innerHTML = "Update Dracarys";
            var Modal = new bootstrap.Modal(document.getElementById('installModal'))
            Modal.show();
            setModal("Update started","Hold on to your dragon, we are updating your modpack to allow you to play the newest version of Dracarys. This won't take long!","Close")    
            downloadAll()
        } else {
            //Launch
            var path = require("path");
            var pack = path.join('C:\\','Program Files (x86)','Minecraft Launcher','MinecraftLauncher.exe');
            exec(pack, function(err, data) {  
                if(err == null) {
                    if(document.getElementById('installModal').classList.contains('show')) {
                        //Don't Show
                        setModal("Minecraft Launcher Closed!","Seems like you closed the minecraft launcher, maybe you want to take a break? Anyways we hope you had fun!","Close");    
                    } else {
                        var Modal = new bootstrap.Modal(document.getElementById('installModal'))
                        Modal.show();
                        document.getElementById("launchButton").disabled = false;
                        document.getElementById('launchButton').innerHTML = "Play Dracarys 1.16.4";
                        setModal("Minecraft Launcher Closed!","Seems like you closed the minecraft launcher, maybe you want to take a break? Anyways we hope you had fun!","Close");     
                    }
                } else {
                    error(err); 
                }            
            });  

            document.getElementById("launchButton").disabled = true;
            document.getElementById('launchButton').innerHTML = "Running";
        }
    } else {


        var path = require("path");
        var dir = path.join(process.env.APPDATA, '.minecraft','mods');
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        document.getElementById("launchButton").disabled = true;
        //Set button to install
        document.getElementById('launchButton').innerHTML = "Install Dracarys";
        var Modal = new bootstrap.Modal(document.getElementById('installModal'))
        Modal.show();
        setModal("Installation started","We are installing the Dracarys Modpack before you can play on the dracarys network, this won't take long!","Here be dragons!")    
        downloadAll()
    }
    document.getElementById('launchButton').blur();
}

//Init

function init() {
    checkOnline();
    //Check if dracarys is installed
    
    if(checkInstalled()) {
        //Check Updates
        checkUpdates();
    } else {
        //Set button to install
        document.getElementById('launchButton').innerHTML = "Install Dracarys";
    }

    get_json("http://cdn.thelynxcompany.ga/launcher/package.json", function (json) {
        document.getElementById('mcVersion').innerHTML = json.minecraft_version;
        document.getElementById('dracarysVersion').innerHTML = " Dracarys v" + json.version;
        document.getElementById('descriptionText').innerHTML = json.servers[0].description;  
        document.getElementById('descriptionIP').innerHTML = " " + json.servers[0].address;  
    });

}

init();

function checkOnline() {
    const status = require('minecraft-server-status');

    get_json("http://cdn.thelynxcompany.ga/launcher/package.json", function (json) {
        status(json.servers[0].ip, json.servers[0].port, response => {
            //console.log(response);
            //console.log(response.online);

            if(response.online) {
                if(json.servers[0].mainteance) {
                    document.getElementById('status').classList.add("text-warning");
                } else {
                    document.getElementById('status').classList.add("text-success");
                }
            } else {
                if(json.servers[0].mainteance) {
                    document.getElementById('status').classList.add("text-warning");
                } else {
                    document.getElementById('status').classList.add("text-danger");
                }
            }
        });
    });


}

var shell = require('electron').shell;
//open links externally by default
$(document).on('click', 'a[href^="http"]', function(event) {
    event.preventDefault();
    shell.openExternal(this.href);
});

function checkInstalled() {
    var path = require("path");
    var pack = path.join(process.env.APPDATA, '.minecraft','mods','pack.dracarys');
    try {
        if (fs.existsSync(pack)) {
            return true;
        } else {
            return false;
        }
    } catch(err) {
        error(err);
        return false;
    }
}

//File Verification
function fileVerification() {
    //console.log("FileVerification")
    changes = 0;
    itemsProcessed = 0;
    get_json("http://cdn.thelynxcompany.ga/launcher/package.json", function (json) {
        var mods_dir = path.join(process.env.APPDATA, '.minecraft','mods')
        fs.readdir(mods_dir, (err, files) => {
            for(let file of files) {
                if(file != "pack.dracarys") {
                    var rta =  json.mods.filter(it => it.filename === file.toString());

                    var filepath = path.join(process.env.APPDATA, '.minecraft','mods',file.toString())
    
                    if(rta[0] == undefined) {
                        //console.log("Delete File! " + file.toString());
                        try {
                            fs.unlinkSync(filepath)
                            //file removed
                        } catch(err) {
                            error(err);
                        }
                    } else {
                        if(rta[0].md5.toString() == md5File.sync(filepath).toString()) {
                            //console.log("File Verified! " + file.toString())
                        } else {
                            //console.log("Update or Corruption! " + file.toString());
                            repair();
                            break;
                        }
                    }
                }
            }
        });
    });
}

//Check For Updates

function checkUpdates() {
    changes = 0;
    itemsProcessed = 0;
    //Only checks for updates in mods

    var updatedFiles = 0;

    get_json("http://cdn.thelynxcompany.ga/launcher/package.json", function (json) {
        var mods_dir = path.join(process.env.APPDATA, '.minecraft','mods')
        fs.readdir(mods_dir, (err, files) => {
            files.forEach(file => {
                
                var rta =  json.mods.filter(it => it.filename === file.toString());

                var filepath = path.join(process.env.APPDATA, '.minecraft','mods',file.toString())


                if(file != "pack.dracarys") {
                    if(rta[0] == undefined) {
                        try {
                            fs.unlinkSync(filepath)
                            //file removed
                        } catch(err) {
                            error(err);
                        }
                    } else {
                        if(rta[0].md5.toString() == md5File.sync(filepath).toString()) {
                            //console.log("File Verified! " + file.toString())
                        } else {
                            //console.log("Update!" + file.toString());
                            changes++;
                        }
                    }
                }

                itemsProcessed++;
                if(itemsProcessed === files.length) {
                    for(let file of json.mods) {
                        try {
                            if (fs.existsSync(path.join(mods_dir,file.filename))) {
                                //file exists
                            } else {
                                //Does not exist must download!
                                update();
                                break;
                            }
                        } catch(err) {
                            error(err);
                        }
                    }


                    callback();
                }

                
            })
        });
    });


    return false;
}

function error(error) {
    if(document.getElementById('installModal').classList.contains('show')) {
        //Don't Show
        setModal("An error occured!","Seems like your dragon broke! " + error,"Close");    
    } else {
        var Modal = new bootstrap.Modal(document.getElementById('installModal'))
        Modal.show();
        setModal("An error occured!","Seems like your dragon broke! " + error,"Close");     
    }
}

function callback() {
    if(changes > 0) {
        update();
    }
}

function repair() {
    if(document.getElementById('installModal').classList.contains('show')) {
        //Don't Show
        setModal("Modpack Corrupt!","Seems your dragon broke, we'll fix and redownload the according files. This won't take long!","Close");    
    } else {
        var Modal = new bootstrap.Modal(document.getElementById('installModal'))
        Modal.show();
        setModal("Modpack Corrupt!","Seems your dragon broke, we'll fix and redownload the according files. This won't take long!","Close");    
    }
    document.getElementById('launchButton').innerHTML = "Fix Dracarys";
    update_available = true;
}

function update() {
    if(document.getElementById('installModal').classList.contains('show')) {
        //Don't Show
    } else {
        var Modal = new bootstrap.Modal(document.getElementById('installModal'))
        Modal.show();
        setModal("Update Available!","Hold on to your dragon, you must update your game to the latest version of Dracarys Modpack to play!","Close");    
    }
    document.getElementById('launchButton').innerHTML = "Update Dracarys";
    update_available = true;
}

//Start Updating

function downloadAll() {
    const promises = []
    get_json("http://cdn.thelynxcompany.ga/launcher/package.json", function (resp) {
        for(var j in resp.mods) {
            num_files = resp.mods.length;
            var path = require("path");
            var minecraft_path = path.join(process.env.APPDATA, '.minecraft','mods');
            promises.push(getFile(resp.mods[j].url,path.join(minecraft_path,resp.mods[j].filename)))
            reportOnPromises(promises, (progress) => setProgress(progress * 100))
        }
    });
}


async function getFile(file_url, targetPath){
    return new Promise((resolve) => {
        var req = request({
            method: 'GET',
            uri: file_url
        });
    
        var out = fs.createWriteStream(targetPath);
        req.pipe(out);
    
        req.on('end', function() {
            resolve(null)
        });
    })
}

function reportOnPromises(promises, callback) {
    let progress = 0
    for (const promise of promises) {
        promise.then(() => {
            progress += 1
            callback(progress / num_files)
        })
    }
}

//PROGRESS BAR

function setProgress(p){
    document.getElementById("install-bar").setAttribute('aria-valuenow',p);
    document.getElementById("install-bar").setAttribute('style','width:'+Number(p)+'%');
    //document.getElementById("install").innerHTML = 'Installing ' +  Math.trunc(p)+'%';
    if(Math.trunc(p) == 100) {
        document.getElementById('launchButton').innerHTML = "Play Dracarys 1.16.4";
        document.getElementById("launchButton").disabled = false;

        //Create Pack File
        var path = require("path");
        var pack = path.join(process.env.APPDATA, '.minecraft','mods','pack.dracarys');
        fs.writeFile(pack, '<DracarysPackMetadata>', function (err) {
            if (err) throw err;
            //console.log('File is created successfully.');
        }); 
        //Verify Installation
        update_available = false;

        setTimeout(() => {
            document.getElementById("install-bar").setAttribute('aria-valuenow','0');
            document.getElementById("install-bar").setAttribute('style','width:0%');
        }, 1000)

        fileVerification();
    }
}


function get_json(url, callback) {
    http.get(url, function(res) {
        var body = '';
        res.on('data', function(chunk) {
            body += chunk;
        });

        res.on('end', function() {
            var response = JSON.parse(body);
            // call function ----v
            callback(response);
        });
    });
}
