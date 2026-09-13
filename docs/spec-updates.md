9/12/2025
https://chat.deepseek.com/a/chat/s/ebd97410-6eda-4c5c-a303-7e64ff464024


Your confirmed sensor stack, ordered by power draw:

#   5 column table.
#	Sensor	Purpose	Cost	Power (active)
1	PIR (AM312)	Wake-up trigger	$2-5	~50 µA
2	Geophone (4.5Hz vertical)	Footstep detection	$45	~10 mA
3	Thermal Array (MLX90640)	Stationary human detection	$30-60	~30 mA
4	ToF Distance (TF-Luna)	Path crossing (optional)	$5-12	~5 mA
5	IR Break-Beam	Trail chokepoint (optional)	$3-8	~2 mA
Why all five:


PIR = cheap always-on tripwire (can't tell wind from person, so it only wakes the others)

Geophone = catches quiet footsteps in soil (great in forest, needs analysis)

Thermal = catches stationary hiders in bushes (great in foliage, no movement needed)

ToF = catches path crossings (great on trails, unspoofable mass change)

IR beam = catches trail entry (100% accurate, but only at chokepoints)

Fusion logic: PIR wakes → firmware samples all others for 2-3 sec → if any 2+ agree → send packet.