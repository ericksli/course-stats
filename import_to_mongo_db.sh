#!/bin/sh

#sicne mongodb seems only read 1 file at a time, so need to do some preprocessing here:
if [ ! -d "data/schedule-overview" ]; then
	echo creating folder: data/schedule-overview
	mkdir -p data/schedule-overview
fi

#drop existing db
echo "dropping db \"course\""
echo "db.dropDatabase()" | mongo course > /dev/null

#gather all json file in one place before import
# echo "coping all json files to 1 place."
cp data/schedule-overview_2015*/*.json data/schedule-overview

#import all json object to mongodb, (in database course, collection cour)
echo "importing json to mongodb db:\"course\";collection:\"cour\""
for i in `ls data/schedule-overview/*.json`;
	do 
		mongoimport --host 127.0.0.1 -d course -c cour --jsonArray $i 2> /dev/null;
done;

# get all distinct code and write then into a temp file called t;
echo "db.cour.distinct('code')" | mongo course > t
# creating result folder;
if [ ! -d "data/schedule-overview-processed" ]; then
	echo "creating folder: data/schedule-overview-processed"
	mkdir -p data/schedule-overview-processed
fi
echo "starting to prcess"
# line 35: get each course code;
# line 37-38: get relative info from mongo db matching with current code and ask mongo db to out put all doc in json format;
# line 39-41: remove some irrelavent text and save the json to $couse_code.json;
for i in `grep t -e ',' | cut -d \" -f 2`;
	do  
		echo "var query=db.cour.find({\"code\":\"$i\"})\nquery.forEach(function(doc){printjson(doc)})"  \
			| mongo course  \
			| grep -v 'MongoDB shell version: 3.0.6' \
			| grep -v 'connection to: course' \
			| grep -v '^bye$' > $i.json
		mv -v $i.json data/schedule-overview-processed;
done;
rm t # house keep tmp file t;
rm -rf data/schedule-overview/ #removing tmp data;
echo "go to data/schedule-overview-processed to view all processed json files"
