from django.db import models
from django.contrib.auth.models import User
from django.shortcuts import render_to_response

from masterinterface.scs_resources.models import Resource

import json
import requests
import StringIO
import csv

fake_csv = """"date_of_birth","waist","smoker","FixedIM","gender","MovedIM","First_Name","weight","Last_Name","country","address","PatientID","autoid"
NULL,38.65964957,2,"C:\Users\smwood\Work\Y3Review\dicom\IM_0320.dcm",2,"C:\Users\smwood\Work\Y3Review\dicom\IM_0408.dcm","Dalton",51.98509226,"Coleman","Virgin Islands, British","Ap #700-2897 Dolor, Road","jRRhMftJ2qtV2Uco9C/E9/nUhqA=",1
NULL,33.79895416,2,"C:\Users\smwood\Work\Y3Review\dicom\IM_0325.dcm",2,"C:\Users\smwood\Work\Y3Review\dicom\IM_0423.dcm","Boris",57.52852986,"Joyce","Samoa","Ap #692-9994 Cubilia Av.","8uk6ZFL/xGQ1BxrCezVgxwuuqLE=",2
NULL,32.1578081,4,"C:\Users\smwood\Work\Y3Review\dicom\IM_0377.dcm",1,"C:\Users\smwood\Work\Y3Review\dicom\IM_0431.dcm","Freya",52.23334131,"Hebert","Slovenia","112-5252 Ante. Street","nIPF979pRagHMUGMnjSi1aKNMeA=",3
NULL,34.5336565,1,"C:\Users\smwood\Work\Y3Review\dicom\IM_0383.dcm",1,"C:\Users\smwood\Work\Y3Review\dicom\IM_0433.dcm","Hop",50.53191368,"Singleton","Benin","Ap #541-9922 Phasellus St.","KUyWW/F60KyyDX20reEZtPHZTlM=",4
NULL,36.0445105,2,"C:\Users\smwood\Work\Y3Review\dicom\IM_0389.dcm",2,"C:\Users\smwood\Work\Y3Review\dicom\IM_0436.dcm","Malcolm",45.21699134,"Becker","Guinea-Bissau","P.O. Box 168, 5437 Euismod St.","MGpFSDGTzCrCb3Xp3wA0c2fwWD0=",5
NULL,39.05727324,4,"C:\Users\smwood\Work\Y3Review\dicom\IM_0390.dcm",2,"C:\Users\smwood\Work\Y3Review\dicom\IM_0439.dcm","Quynn",50.99911053,"Boyle","Turkmenistan","989-6482 Viverra. Road","o5sBdZVEPoLAwXjoXCFqGZqBkA0=",6
NULL,39.14665053,4,"C:\Users\smwood\Work\Y3Review\dicom\IM_0397.dcm",1,"C:\Users\smwood\Work\Y3Review\dicom\IM_0442.dcm","Hilel",42.97475325,"Blackwell","Jordan","379-2236 A, St.","/PLXF2HHJwLFjX3PkstH0lYOUV8=",7
NULL,35.25776665,1,"C:\Users\smwood\Work\Y3Review\dicom\IM_0400.dcm",1,"C:\Users\smwood\Work\Y3Review\dicom\IM_08012.dcm","Micah",45.5508206,"Mejia","Taiwan","1987 Dictum Rd.","/1Cadddh53zzn1k8PAjYjIdtuvw=",8
NULL,35.40281641,3,"C:\Users\smwood\Work\Y3Review\dicom\IM_0407.dcm",1,"C:\Users\smwood\Work\Y3Review\dicom\IM_08014.dcm","Desiree",60.84924424,"Casey","United Kingdom (Great Britain)","Ap #658-4631 Primis Avenue","l3bVOw3HHgkNmqbXKP0a/Azbo9U=",9"""

class DatasetQuery(models.Model):
    """
    """

    id = models.AutoField(primary_key=True)
    date = models.DateTimeField(auto_now=True)
    name = models.CharField(max_length=100, default="")
    user = models.ManyToManyField(User)
    query = models.TextField()
    global_id = models.CharField(null=True, max_length=39)


    def __unicode__(self):
        return self.name

    def send_query(self, ticket):
        """
        """
        json_query = json.loads(self.query)
        dataset = Resource.objects.get(global_id=self.global_id)
        data = {
            "dataset": dataset,
            "select": json_query["select"],
            "where": json_query["where"]
        }
        xml_query = render_to_response("datasets/query_template.xml", data)
        if dataset.metadata['localID'][-1] != '/':
            dataset.metadata['localID'] = dataset.metadata['localID'] + '/'

        results = requests.post("%sxmlquery/DatasetSOAPQuery.asmx" % dataset.metadata['localID'],
                      data=xml_query.content,
                      auth=("admin", ticket),
                      headers = {'content-type': 'text/xml', 'SOAPAction': 'http://vph-share.eu/dms/Query'},
                      verify=False
        ).text
        if "<QueryResult />" in results:
            return ""
        else:
            return results[results.find("<QueryResult>")+len("<QueryResult>"):results.find("</QueryResult>")]

    def get_header(self, ticket):
        csv_results = self.send_query(ticket)
        return csv.reader(StringIO.StringIO(csv_results)).next()

    def get_results(self, ticket):
        csv_results = csv.reader(StringIO.StringIO(self.send_query(ticket)))
        #ignore the first header row
        csv_results.next()
        return [ row for row in csv_results ]

    def get_results_number(self, ticket):
        """
        """
        csv_results = self.send_query(ticket)
        return len(StringIO.StringIO(csv_results).readlines())





