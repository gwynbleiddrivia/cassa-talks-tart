# tart
Transient Array Radio Telescope

##note to contributors
run this command on git bash terminal to leave line endings as they are
```
git config --global core.autocrlf input
```
All the commands on this README.md was run for stimela version 2.0.1.1 and apptainer version 1.4.4<br>


# Installation
This installation method needs WSL 2<br>
You must need WSL2. To check the WSL version clearlt, go to powershell or git bash and type<br>
```
wsl -l -v
```
If it is WSL 2, then proceed to the next step. If ot then, install WSL 2 at first. <br> 
Go to WSL terminal, then <br>
## Installing apptainer globally
```
sudo apt update
wget https://github.com/apptainer/apptainer/releases/download/v1.4.4/apptainer_1.4.4_amd64.deb
wget https://github.com/apptainer/apptainer/releases/download/v1.4.4/apptainer-suid_1.4.4_amd64.deb

sudo apt install -y ./apptainer_1.4.4_amd64.deb
sudo dpkg -i ./apptainer-suid_1.4.4_amd64.deb

apptainer --version
```
## Installing extra runtime dependencies
```
sudo apt install -y squashfuse fuse2fs gocryptfs
```


## Make a dedicated directory and cd into it
```
mkdir pipeline
cd pipeline
```


## Installing tart cargo and stimela into a virtual environment
```
python3 -m venv start
source start/bin/activate
pip install tart_cargo
pip install cult_cargo
pip install stimela

```

## Copy necessary files and folders into your directory
At first, git clone this repo<br>
Then, assuming you have git cloned into D: partition in your Windows<br>
```
cp /mnt/d/tart/tart_dl.yaml .
cp /mnt/d/tart/casacabs.yaml .
cp /mnt/d/tart/make_mov.py .
cp -r /mnt/d/tart/casa/ ./casa/
```

## Check all the steps in the tart_dl.yaml recipe by running this stimela command
```
stimela doc tart_dl.yaml
```

The steps are - <br>
initimgdir<br>
initdatadownloaddir<br>
initdatacaltabledir<br>
initmsdir<br>
download-hdf<br>
create-ms<br>
updateobservatory<br>
flagsave<br>
plotuv<br>
plotants<br>
lister<br>
calibrate_amplitude<br>
plotcaltable_amp<br>
calibrate_phase<br>
plotcaltable_phase<br>
applycal<br>
snapshotimage<br>     



# The command structure
## The basic command with the required input to run all steps is - <br>
```
stimela run tart=<host name>
```
The host names for the correspondent TART telescopes across the map-<br>

IUB - Bangladesh: bd-iub<br>
New Zealand - Dunedin: nz-elec<br>
Bel Air - Mauritius: mu-udm<br>
TUK/KSA - Kenya: tart-kenya<br>
Copperbelt University - Zambia: zm-cbu<br>
Namibia - UNAM: na-unam<br>
GRAO - Ghana: ghana<br>
Rhodes University, Grahamstown: za-rhodes<br>

## The basic command with optional inputs is -
```
stimela run tart=<host name> imgdir=<default: img> h5dir=<default: rawdata> raw_data_nfile=<default: 10> cal_table_dir=<default: caltables> msdir=<default: msdir> do_download=<default: False>
```

Other than the tart input, all the other inputs are optional and are given the default value i.e. 10 raw images will de downloaded in the rawdata folder, if not specified otherwise.<br>


## The basic command with specified step is -
```
stimela run tart_dl.yaml tart=bd-iub -s <step name>
```

# It is wise to run individual steps to see what happens. Let's find out!
initimgdir<br>
initdatadownloaddir<br>
initdatacaltabledir<br>
initmsdir<br>
These 4 steps can be omitted, just do the following, then go to step download-hdf
```
mkdir stimela_images
mkdir img
mkdir rawdata
mkdir caltables
mkdir msdir
```
Every step must run sequentially one by one, starting from download-hdf. Otherwise, there will be errors.<br>

Always make sure that every command runs from the `pipeline` directory.<br>

 
## to run the step download-hdf
```
stimela run tart_dl.yaml tart=bd-iub -s download-hdf
```

This downloads 10 hdf images into `rawdata` folder and creates a stimela image file `.simg` file in the stimela_images folder

## to run the step create-ms
```
stimela run tart_dl.yaml tart=bd-iub -s create-ms
```

It retrieves GNSS source catalogues, collects observatory parameters like L0_frequency, bandwidth, baseband_frequency,  operating_frequency, number of antennas and sampling frequency, the telescope position (latitude and logitude), snapshot directions, computes UVW cordinates towards original zenith points, and finally creates the Measurement Set file.<br>
This process is done by tart2ms.<br>
The 600 model source files in the msdir directory show the decimal values of Right Ascension and Declination, Stokes I flux density (10000 is a dummy value), Spectral Index (0.0 for flat spectrum), freq0 as the Reference frequency 1575.42 MHz - for satellites like GSAT, BEIDOU, QZS, GPS. 

From the report of workshop 2 group 5 (page 25)-<br>
"...Raw data was converted into Measurement Sets (MS), the standard radio astronomy data format. The tart2ms cab (from tart-cargo) generated a bd-iub.ms folder under msdir in about 4 minutes. I had 600 .txt model-source files containing information on GNSS satellites(GPS, Galileo, GAGAN, Beidou) for later calibration and several folders (ANTENNA, DATA_DESCRIPTION,FEED, FIELD, FLAG_CMD, HISTORY, OBSERVATION, POINTING, POLARIZATION,PROCESSOR, SOURCE, SPECTRAL_WINDOW, and STATE) under bd-iub.ms. This part utilized tart2ms cab."

## to run the step update-observatory
```
stimela run tart_dl.yaml tart=bd-iub -s updateobservatory
```

It updates some configuration files


## to run the step flagsave
```
stimela run tart_dl.yaml tart=bd-iub -s flagsave
```

Since we would modify our raw data in the future steps, we need to save
the current state so that we can return to it if something goes wrong in the future steps.<br> Notice that msdir folder has now a new sub-folder ’bd-iub.ms.flagversions’ now<br>
This part utilizes casa.flagman cab<br>


## to run the step plotuv
```
stimela run tart_dl.yaml tart=bd-iub -s plotuv
```
In the msdir folder, a UV.png is generated. It can be found under 600 model source txt files. This plot is generated from MS files and underlying cab is casa.plotms<br>
<p align="center">
<img src="assets/UV.png" width="500">
<br>
UV plot
</p>

## to run the step plotants
```
stimela run tart_dl.yaml tart=bd-iub -s plotants
```

This plotants part utilizes casa.plotants cab<br>
This produces an antenns positioning image<br>
This is also in the msdir folder<br>

<p align="center">
<img src="assets/antconfig.png" width="500">
<br>
Antenna Positions
</p>



## to run the step lister
```
stimela run tart_dl.yaml tart=bd-iub -s lister
```

The lister gives a summary of the information we have saved so far.
It covers the antenna information, observation time, frequency and more data fields. 

## to run the step calibrate_amplitude
```
stimela run tart_dl.yaml tart=bd-iub -s calibrate_amplitude
```
Running calibrate_amplitude created new ANTENNA, FIELD, HISTORY, OBSERVATION,
SPECTRAL_WINDOW folders and some tables of dat format under the newly produced
caltables/tart.G0a folder. They were created by processing MS data through casa.gaincal cab<br>



## to run the step plotcaltable_amp
```
stimela run tart_dl.yaml tart=bd-iub -s plotcaltable_amp
```

Then plotcaltable_amp created ganamp.tart.png in the caltables folder. This step utilized casa.plotms cab.<br>

<p align="center">
<img src="assets/gainamp.tart.png" width="500">
<br>
Gain vs Amplitude
</p>

## to run the step calibrate_phase
```
stimela run tart_dl.yaml tart=bd-iub -s calibrate_phase
```

After that, calibrate_phase generated tart.G0p folder under caltables folder. <br>
tart.G0p also contained ANTENNA, OBSERVATION, FIELD, HISTORY and SPECTRAL WINDOW
subfolders, just like tart.G0a utilizing the same casa.gaincal cab. Using msdir/bd-iub.ms and
caltables/tart.G0a, this step calculated phase solutions and then put the outputs in the new
folder.<br>



## to run the step plotcaltable_phase
```
stimela run tart_dl.yaml tart=bd-iub -s plotcaltable_phase
```

Then plotcaltable_phase created 24 gain phase versus time plots for each antenna, using the
previous tart.G0p folder information, within seconds, using the previously used casa.plotms cab.<br>


<p align="center">
<img src="assets/gainphase_ant1.png" width="500">
<br>
Gain Phase vs Time for Antenna 1
</p>


## to run the step applycal
```
stimela run tart_dl.yaml tart=bd-iub -s applycal
```

The applycal stage used msdir/bd-iub.ms and the gain tables (G0a, G0p) to correct all
visibility points. It stored a snapshot at:
msdir/bd-iub.ms.flagversions/applycal_1<br>


## to run the step snapshotimage
```
stimela run tart_dl.yaml tart=bd-iub -s snapshotimage
```
Now we are ready to create FITS files using snapshotimage! This step finally uses WSClean, after a lot of CASA cabs. So, it takes some time to build the image. This is the deconvolution
and cleaning pipeline. Here, the visibilites and uv grids are loaded for fourier inversion, and the
PSF/synthesized beam is calculated. Inverse FFT creates dirty images. Using the PSF, model
sources are subtracted and residuals are updated. Combing every part, clean image is produced.
Many many fft and deconvolution iterations happens in this step.<br>
The fits files are now in the `img` folder.